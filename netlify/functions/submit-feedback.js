/**
 * Submit Feedback - Netlify Function
 * Collects and logs customer feedback submissions
 */

const fs = require('fs').promises;
const path = require('path');

exports.handler = async (event, context) => {
    // Enable CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ message: 'CORS preflight' })
        };
    }

    // Only accept POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ 
                success: false, 
                error: 'Method not allowed. Use POST.' 
            })
        };
    }

    try {
        // Parse request body
        let feedbackData;
        try {
            feedbackData = JSON.parse(event.body);
        } catch (parseError) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    error: 'Invalid JSON in request body' 
                })
            };
        }

        // Validate required fields
        if (!feedbackData.type || !feedbackData.message) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    error: 'Missing required fields: type and message' 
                })
            };
        }

        // Create feedback entry with metadata
        const feedbackEntry = {
            id: generateId(),
            timestamp: new Date().toISOString(),
            type: sanitize(feedbackData.type),
            message: sanitize(feedbackData.message),
            email: feedbackData.email ? sanitize(feedbackData.email) : '',
            page_url: feedbackData.page_url || '',
            user_agent: feedbackData.user_agent || '',
            ip_address: event.headers['x-forwarded-for'] || event.headers['x-nf-client-connection-ip'] || 'unknown',
            status: 'new'
        };

        // Log to server logs for immediate visibility
        console.log('=== NEW FEEDBACK SUBMISSION ===');
        console.log(`ID: ${feedbackEntry.id}`);
        console.log(`Type: ${feedbackEntry.type}`);
        console.log(`Message: ${feedbackEntry.message}`);
        console.log(`Email: ${feedbackEntry.email}`);
        console.log(`Page: ${feedbackEntry.page_url}`);
        console.log(`IP: ${feedbackEntry.ip_address}`);
        console.log(`Timestamp: ${feedbackEntry.timestamp}`);
        console.log('================================');

        // Store feedback (multiple storage methods for reliability)
        await Promise.all([
            storeFeedbackToFile(feedbackEntry),
            storeFeedbackToNetlifyLogs(feedbackEntry)
        ]);

        // Send email notification if configured
        await sendEmailNotification(feedbackEntry);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                success: true, 
                message: 'Feedback submitted successfully',
                feedback_id: feedbackEntry.id
            })
        };

    } catch (error) {
        console.error('Feedback submission error:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                error: 'Internal server error. Please try again later.' 
            })
        };
    }
};

// Helper Functions

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function sanitize(input) {
    if (typeof input !== 'string') return '';
    return input.replace(/<[^>]*>/g, '').substring(0, 1000).trim();
}

async function storeFeedbackToFile(feedback) {
    try {
        // Store in a JSON file for easy access
        const feedbackDir = '/tmp/feedback';
        const feedbackFile = path.join(feedbackDir, 'submissions.json');
        
        // Create directory if it doesn't exist
        try {
            await fs.mkdir(feedbackDir, { recursive: true });
        } catch (dirError) {
            // Directory might already exist
        }
        
        // Read existing feedback
        let existingFeedback = [];
        try {
            const data = await fs.readFile(feedbackFile, 'utf8');
            existingFeedback = JSON.parse(data);
        } catch (readError) {
            // File might not exist yet
        }
        
        // Add new feedback
        existingFeedback.push(feedback);
        
        // Keep only last 100 entries to prevent file from growing too large
        if (existingFeedback.length > 100) {
            existingFeedback = existingFeedback.slice(-100);
        }
        
        // Write back to file
        await fs.writeFile(feedbackFile, JSON.stringify(existingFeedback, null, 2));
        
        console.log(`Feedback stored to file: ${feedback.id}`);
    } catch (error) {
        console.error('Error storing feedback to file:', error);
        // Don't throw - this is a fallback storage method
    }
}

async function storeFeedbackToNetlifyLogs(feedback) {
    // Store as structured log entry that can be easily searched
    const logEntry = {
        event: 'CUSTOMER_FEEDBACK',
        feedback_id: feedback.id,
        feedback_type: feedback.type,
        timestamp: feedback.timestamp,
        has_email: !!feedback.email,
        page: feedback.page_url,
        ip: feedback.ip_address,
        message_length: feedback.message.length
    };
    
    console.log('FEEDBACK_LOG:', JSON.stringify(logEntry));
}

async function sendEmailNotification(feedback) {
    // This would integrate with an email service like SendGrid, Mailgun, or AWS SES
    // For now, we'll just log the notification
    console.log('EMAIL_NOTIFICATION: New feedback received');
    console.log(`Subject: New ${feedback.type} feedback from CostFlowAI`);
    console.log(`From: ${feedback.email || 'anonymous'}`);
    console.log(`Message: ${feedback.message.substring(0, 100)}...`);
    
    // TODO: Implement actual email sending when email service is configured
    // Example with SendGrid:
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // 
    // const msg = {
    //     to: 'support@costflowai.com',
    //     from: 'noreply@costflowai.com',
    //     subject: `New ${feedback.type} feedback from CostFlowAI`,
    //     html: generateEmailTemplate(feedback)
    // };
    // 
    // await sgMail.send(msg);
}

function generateEmailTemplate(feedback) {
    return `
        <h2>New Feedback Received</h2>
        <p><strong>Type:</strong> ${feedback.type}</p>
        <p><strong>Email:</strong> ${feedback.email || 'Not provided'}</p>
        <p><strong>Page:</strong> ${feedback.page_url}</p>
        <p><strong>Time:</strong> ${feedback.timestamp}</p>
        <p><strong>Message:</strong></p>
        <blockquote>${feedback.message}</blockquote>
        <hr>
        <p><small>Feedback ID: ${feedback.id}</small></p>
    `;
}