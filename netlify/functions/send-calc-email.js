/**
 * Netlify Function: Send Calculator Results via Email
 * Sends calculation results to users using Resend API
 */

const { Resend } = require('resend');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    // Return 404 if no API key configured (signals to use mailto fallback)
    if (!process.env.RESEND_API_KEY) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ message: 'Email API not configured, use mailto fallback' })
      };
    }
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

  try {
    // Check if API key is configured
    if (!process.env.RESEND_API_KEY) {
      return {
        statusCode: 503,
        headers,
        body: JSON.stringify({ 
          error: 'Email service not configured', 
          message: 'Please use the mailto fallback option' 
        })
      };
    }
    
    // Parse request body
    const { email, calculatorType, calculationData } = JSON.parse(event.body);

    // Validate inputs
    if (!email || !calculatorType || !calculationData) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid email format' })
      };
    }

    // Initialize Resend
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Format calculation results for email
    const formatCalculationResults = (data) => {
      const { inputs, results } = data;
      
      switch (calculatorType) {
        case 'paint':
          return {
            subject: 'Your Paint Calculator Results from CostFlowAI',
            inputs: [
              { label: 'Wall Area', value: `${inputs.wallArea} sq ft` },
              { label: 'Openings (doors/windows)', value: `${inputs.openings} sq ft` },
              { label: 'Number of Coats', value: inputs.coats },
              { label: 'Surface Texture', value: inputs.texture },
              { label: 'Paint Quality', value: inputs.quality },
              { label: 'Primer Required', value: inputs.primer ? 'Yes' : 'No' }
            ],
            results: [
              { label: 'Paintable Area', value: `${results.paintableArea} sq ft` },
              { label: 'Paint Needed', value: `${results.gallons} gallons` },
              { label: 'Primer Needed', value: `${results.primerGallons} gallons` },
              { label: 'Paint Cost', value: `$${results.paintCost}` },
              { label: 'Primer Cost', value: `$${results.primerCost}` },
              { label: 'Labor Cost', value: `$${results.laborCost}` },
              { label: 'Total Project Cost', value: `$${results.totalCost}` }
            ]
          };
        default:
          return {
            subject: `Your ${calculatorType} Calculator Results from CostFlowAI`,
            inputs: Object.entries(inputs).map(([key, value]) => ({
              label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
              value: value.toString()
            })),
            results: Object.entries(results).map(([key, value]) => ({
              label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
              value: typeof value === 'number' && key.toLowerCase().includes('cost') 
                ? `$${value}` 
                : value.toString()
            }))
          };
      }
    };

    const emailContent = formatCalculationResults(calculationData);
    
    // Create HTML email content
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${emailContent.subject}</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background: #ffffff;
      padding: 30px;
      border: 1px solid #e5e7eb;
      border-top: none;
    }
    .results-section {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 20px;
      margin: 20px 0;
    }
    .results-table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    .results-table th,
    .results-table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    .results-table th {
      background: #f3f4f6;
      font-weight: 600;
    }
    .total-row {
      font-weight: bold;
      background: #ecfdf5;
      border-top: 2px solid #10b981;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #6b7280;
      font-size: 14px;
      border-top: 1px solid #e5e7eb;
    }
    .footer a {
      color: #2563eb;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎨 ${emailContent.subject}</h1>
    <p>Professional construction cost calculation results</p>
  </div>
  
  <div class="content">
    <p>Thank you for using CostFlowAI! Here are your detailed calculation results:</p>
    
    <div class="results-section">
      <h3>📋 Project Inputs</h3>
      <table class="results-table">
        <thead>
          <tr>
            <th>Parameter</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          ${emailContent.inputs.map(input => 
            `<tr><td>${input.label}</td><td>${input.value}</td></tr>`
          ).join('')}
        </tbody>
      </table>
    </div>
    
    <div class="results-section">
      <h3>💰 Calculation Results</h3>
      <table class="results-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${emailContent.results.map((result, index) => 
            `<tr ${result.label.toLowerCase().includes('total') ? 'class="total-row"' : ''}>
              <td>${result.label}</td>
              <td>${result.value}</td>
            </tr>`
          ).join('')}
        </tbody>
      </table>
    </div>
    
    <p><strong>Generated:</strong> ${new Date(calculationData.timestamp).toLocaleString()}</p>
    
    <p>⚠️ <em>These calculations are estimates based on industry averages. Actual costs may vary based on local market conditions, material quality, and project complexity. Always consult with contractors for precise quotes.</em></p>
  </div>
  
  <div class="footer">
    <p>
      This calculation was generated by <a href="https://costflowai.com">CostFlowAI</a><br>
      Visit us for more professional construction calculators and cost analysis tools.
    </p>
  </div>
</body>
</html>`;

    // Send email using Resend
    const result = await resend.emails.send({
      from: 'CostFlowAI Calculators <noreply@costflowai.com>',
      to: [email],
      subject: emailContent.subject,
      html: htmlContent
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully',
        emailId: result.id 
      })
    };

  } catch (error) {
    console.error('Send email error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to send email',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
};