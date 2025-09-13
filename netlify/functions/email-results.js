/**
 * Netlify Function: Enhanced Email Results with Rate Limiting
 * Sends calculation results via email using Postmark/SendGrid/Resend
 * Includes IP-based rate limiting and enhanced validation
 */

const { Resend } = require('resend');

// In-memory rate limiting (simple approach for Netlify Functions)
// In production, consider using external storage like Redis or KV
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 5; // Max 5 emails per IP per 15min window

/**
 * Get client IP from event
 */
function getClientIP(event) {
  return event.headers['x-forwarded-for'] || 
         event.headers['x-real-ip'] || 
         event.headers['client-ip'] || 
         'unknown';
}

/**
 * Check and update rate limit for IP
 */
function checkRateLimit(ip) {
  const now = Date.now();
  const key = `rate_${ip}`;
  
  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
  }
  
  const limit = rateLimitStore.get(key);
  
  // Reset if window has passed
  if (now > limit.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
  }
  
  // Check if limit exceeded
  if (limit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { 
      allowed: false, 
      remaining: 0,
      resetTime: limit.resetTime - now
    };
  }
  
  // Increment counter
  limit.count++;
  rateLimitStore.set(key, limit);
  
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - limit.count };
}

/**
 * Clean up expired rate limit entries
 */
function cleanupRateLimits() {
  const now = Date.now();
  for (const [key, limit] of rateLimitStore.entries()) {
    if (now > limit.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate calculation payload
 */
function validateCalculation(calculation) {
  if (!calculation || typeof calculation !== 'object') {
    return false;
  }
  
  const required = ['type', 'title', 'inputs', 'results', 'timestamp'];
  return required.every(field => calculation.hasOwnProperty(field));
}

/**
 * Sanitize text content
 */
function sanitizeText(text) {
  if (typeof text !== 'string') return String(text);
  return text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
             .replace(/<[^>]*>/g, '')
             .trim();
}

/**
 * Format calculation for email
 */
function formatCalculationEmail(calculation) {
  const type = sanitizeText(calculation.type);
  const title = sanitizeText(calculation.title);
  const timestamp = new Date(calculation.timestamp).toLocaleString();
  
  let inputsHtml = '';
  if (calculation.inputs && typeof calculation.inputs === 'object') {
    inputsHtml = Object.entries(calculation.inputs)
      .map(([key, value]) => {
        const label = sanitizeText(key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()));
        const val = sanitizeText(String(value));
        return `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 500;">${label}</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${val}</td></tr>`;
      })
      .join('');
  }
  
  let resultsHtml = '';
  if (calculation.results && typeof calculation.results === 'object') {
    resultsHtml = Object.entries(calculation.results)
      .map(([key, value]) => {
        const label = sanitizeText(key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()));
        let val = sanitizeText(String(value));
        
        // Format currency values
        if (typeof value === 'number' && key.toLowerCase().includes('cost')) {
          val = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          }).format(value);
        }
        
        const isTotal = label.toLowerCase().includes('total');
        const rowStyle = isTotal 
          ? 'background: #ecfdf5; font-weight: bold; border-top: 2px solid #10b981;'
          : '';
        
        return `<tr style="${rowStyle}"><td style="padding: 12px 8px; border-bottom: 1px solid #eee; ${isTotal ? 'font-weight: 600;' : ''}">${label}</td><td style="padding: 12px 8px; border-bottom: 1px solid #eee; ${isTotal ? 'font-weight: 600;' : ''}">${val}</td></tr>`;
      })
      .join('');
  }
  
  return {
    subject: `Your ${title} Results from CostFlowAI`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your ${title} Results</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
  
  <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 24px;">🎯 ${title}</h1>
    <p style="margin: 10px 0 0; opacity: 0.9;">Professional construction cost calculation</p>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="margin-top: 0;">Thank you for using CostFlowAI! Here are your detailed calculation results:</p>
    
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px; margin: 20px 0;">
      <h3 style="color: #1e293b; margin-top: 0;">📋 Project Inputs</h3>
      <table style="width: 100%; border-collapse: collapse;">
        ${inputsHtml}
      </table>
    </div>
    
    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 20px; margin: 20px 0;">
      <h3 style="color: #166534; margin-top: 0;">💰 Calculation Results</h3>
      <table style="width: 100%; border-collapse: collapse;">
        ${resultsHtml}
      </table>
    </div>
    
    <p style="margin-bottom: 0;"><strong>Generated:</strong> ${timestamp}</p>
    
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px; color: #92400e;">
        ⚠️ <strong>Disclaimer:</strong> These calculations are estimates based on industry standards and your inputs. 
        Actual costs may vary based on local market conditions, material availability, labor rates, and project complexity. 
        Always consult with qualified contractors for precise quotes and professional advice.
      </p>
    </div>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; background: white;">
    <p style="margin: 0;">
      This calculation was generated by <a href="https://costflowai.com" style="color: #2563eb; text-decoration: none;">CostFlowAI</a><br>
      Visit us for more professional construction calculators and cost analysis tools.
    </p>
  </div>
  
</body>
</html>`
  };
}

exports.handler = async (event, context) => {
  // Clean up expired rate limits
  cleanupRateLimits();
  
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight OPTIONS request
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
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Get client IP and check rate limit
  const clientIP = getClientIP(event);
  const rateLimit = checkRateLimit(clientIP);
  
  if (!rateLimit.allowed) {
    return {
      statusCode: 429,
      headers: {
        ...headers,
        'Retry-After': Math.ceil(rateLimit.resetTime / 1000)
      },
      body: JSON.stringify({ 
        error: 'Rate limit exceeded',
        message: 'Too many email requests. Please try again later.',
        retryAfterSeconds: Math.ceil(rateLimit.resetTime / 1000)
      })
    };
  }

  try {
    // Check if email service is configured
    if (!process.env.EMAIL_API_KEY && !process.env.RESEND_API_KEY) {
      return {
        statusCode: 503,
        headers,
        body: JSON.stringify({ 
          error: 'Email service not configured', 
          message: 'Please contact support or use the print/save functions instead.' 
        })
      };
    }
    
    // Parse and validate request body
    let requestData;
    try {
      requestData = JSON.parse(event.body);
    } catch (error) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid JSON payload' })
      };
    }
    
    const { email, calculation } = requestData;

    // Validate required fields
    if (!email || !calculation) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required fields',
          message: 'Both email and calculation data are required.' 
        })
      };
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid email format',
          message: 'Please provide a valid email address.' 
        })
      };
    }

    // Validate calculation structure
    if (!validateCalculation(calculation)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid calculation data',
          message: 'Calculation must include type, title, inputs, results, and timestamp.' 
        })
      };
    }

    // Initialize email service (prioritize Resend)
    let emailService;
    if (process.env.RESEND_API_KEY) {
      emailService = new Resend(process.env.RESEND_API_KEY);
    } else {
      // Could add SendGrid/Postmark support here if needed
      return {
        statusCode: 503,
        headers,
        body: JSON.stringify({ 
          error: 'Email service not available',
          message: 'No supported email service configured.' 
        })
      };
    }

    // Format email content
    const emailContent = formatCalculationEmail(calculation);
    
    // Send email
    const result = await emailService.emails.send({
      from: process.env.FROM_EMAIL || 'CostFlowAI Calculators <noreply@costflowai.com>',
      to: [email],
      subject: emailContent.subject,
      html: emailContent.html
    });

    // Log success (without exposing email)
    console.log(`Email sent successfully: ${result.id || 'success'} for calculator ${calculation.type}`);

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'X-RateLimit-Remaining': rateLimit.remaining.toString()
      },
      body: JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully!',
        emailId: result.id,
        remaining: rateLimit.remaining
      })
    };

  } catch (error) {
    console.error('Email function error:', error);
    
    // Don't expose internal errors in production
    const isDev = process.env.NODE_ENV === 'development';
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to send email',
        message: 'An internal error occurred. Please try again later.',
        details: isDev ? error.message : undefined
      })
    };
  }
};