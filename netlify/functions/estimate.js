/**
 * Netlify Function: Construction Estimate Proxy
 * Proxies requests to n8n workflow with security and rate limiting
 */

const rateLimit = require('lambda-rate-limiter')({
  interval: 60 * 1000, // 1 minute
  max: process.env.RATE_LIMIT_PER_MINUTE || 10
}).check;

// Simple in-memory cache for rate limiting (use Redis in production)
const requestCounts = new Map();

exports.handler = async (event, context) => {
  const startTime = Date.now();
  const requestId = context.awsRequestId || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': process.env.CORS_ORIGINS || 'https://costflowai.com',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'X-Request-ID': requestId,
    'X-Processing-Start': new Date().toISOString()
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        error: 'Method not allowed',
        message: 'Only POST requests are supported',
        requestId
      })
    };
  }

  try {
    // Parse request body
    let payload;
    try {
      payload = JSON.parse(event.body);
    } catch (parseError) {
      console.error('Request parsing error:', parseError.message, 'RequestID:', requestId);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid JSON payload',
          message: 'Request body must be valid JSON',
          requestId
        })
      };
    }

    // Basic validation
    const requiredFields = ['client_name', 'client_email', 'project_type', 'zip', 'gross_sqft'];
    const missingFields = requiredFields.filter(field => !payload[field]);
    
    if (missingFields.length > 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Missing required fields',
          message: `Required fields: ${missingFields.join(', ')}`,
          requestId
        })
      };
    }

    // Rate limiting by IP and email
    const clientIP = event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown';
    const clientEmail = payload.client_email.toLowerCase().trim();
    const rateLimitKey = `${clientIP}:${clientEmail}`;
    
    // Simple rate limiting (replace with Redis/DynamoDB in production)
    const now = Date.now();
    const windowStart = now - (60 * 1000); // 1 minute window
    
    if (!requestCounts.has(rateLimitKey)) {
      requestCounts.set(rateLimitKey, []);
    }
    
    const requests = requestCounts.get(rateLimitKey).filter(time => time > windowStart);
    const rateLimitPerMinute = parseInt(process.env.RATE_LIMIT_PER_MINUTE) || 10;
    
    if (requests.length >= rateLimitPerMinute) {
      console.warn('Rate limit exceeded:', rateLimitKey, 'RequestID:', requestId);
      return {
        statusCode: 429,
        headers: {
          ...headers,
          'Retry-After': '60'
        },
        body: JSON.stringify({
          error: 'Rate limit exceeded',
          message: `Maximum ${rateLimitPerMinute} requests per minute allowed`,
          requestId,
          retryAfter: 60
        })
      };
    }
    
    requests.push(now);
    requestCounts.set(rateLimitKey, requests);

    // Input size validation
    const payloadSize = JSON.stringify(payload).length;
    const maxPayloadSize = 50 * 1024; // 50KB
    
    if (payloadSize > maxPayloadSize) {
      return {
        statusCode: 413,
        headers,
        body: JSON.stringify({
          error: 'Payload too large',
          message: `Request size ${payloadSize} bytes exceeds maximum of ${maxPayloadSize} bytes`,
          requestId
        })
      };
    }

    // Bot protection (simple check)
    if (process.env.BOT_PROTECTION === 'true') {
      const userAgent = event.headers['user-agent'] || '';
      const suspiciousBots = ['bot', 'crawler', 'spider', 'scraper'];
      
      if (suspiciousBots.some(bot => userAgent.toLowerCase().includes(bot))) {
        console.warn('Potential bot detected:', userAgent, 'RequestID:', requestId);
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({
            error: 'Access denied',
            message: 'Automated requests are not permitted',
            requestId
          })
        };
      }
    }

    // Prepare request to n8n webhook
    const n8nUrl = process.env.N8N_WEBHOOK_URL;
    const n8nSecret = process.env.N8N_SECRET;
    
    if (!n8nUrl || !n8nSecret) {
      console.error('Missing n8n configuration. RequestID:', requestId);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Configuration error',
          message: 'Estimation service is not properly configured',
          requestId
        })
      };
    }

    // Add metadata to payload
    const enrichedPayload = {
      ...payload,
      requestId,
      timestamp: new Date().toISOString(),
      clientIP,
      userAgent: event.headers['user-agent'] || 'unknown'
    };

    console.log('Forwarding request to n8n:', requestId, 'Size:', payloadSize, 'IP:', clientIP);

    // Forward request to n8n webhook
    const fetch = require('node-fetch');
    const response = await fetch(n8nUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-Secret': n8nSecret,
        'X-Request-ID': requestId
      },
      body: JSON.stringify(enrichedPayload),
      timeout: 30000 // 30 second timeout
    });

    const processingTime = Date.now() - startTime;
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('n8n error response:', response.status, errorText, 'RequestID:', requestId);
      
      return {
        statusCode: response.status === 429 ? 429 : 500,
        headers: {
          ...headers,
          'X-Processing-Time': processingTime.toString()
        },
        body: JSON.stringify({
          error: 'Estimation service error',
          message: response.status === 429 ? 'Service temporarily overloaded' : 'Failed to process estimate',
          requestId,
          processingTime
        })
      };
    }

    // Handle different response types
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/pdf')) {
      // Binary PDF response
      const pdfBuffer = await response.buffer();
      
      console.log('PDF generated successfully:', requestId, 'Size:', pdfBuffer.length, 'Time:', processingTime + 'ms');
      
      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="estimate-${requestId}.pdf"`,
          'X-Processing-Time': processingTime.toString()
        },
        body: pdfBuffer.toString('base64'),
        isBase64Encoded: true
      };
    } else {
      // JSON response (likely async processing)
      const jsonResponse = await response.json();
      
      console.log('JSON response received:', requestId, 'Status:', jsonResponse.status, 'Time:', processingTime + 'ms');
      
      return {
        statusCode: response.status,
        headers: {
          ...headers,
          'Content-Type': 'application/json',
          'X-Processing-Time': processingTime.toString()
        },
        body: JSON.stringify({
          ...jsonResponse,
          requestId,
          processingTime
        })
      };
    }

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    console.error('Estimation function error:', error.message, 'RequestID:', requestId, error.stack);
    
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'X-Processing-Time': processingTime.toString()
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: 'An unexpected error occurred while processing your estimate',
        requestId,
        processingTime
      })
    };
  }
};