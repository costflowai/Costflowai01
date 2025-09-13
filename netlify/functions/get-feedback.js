/**
 * Get Feedback - Netlify Function
 * Retrieves stored feedback for admin dashboard
 * Requires admin authentication
 */

const fs = require('fs').promises;
const path = require('path');

exports.handler = async (event, context) => {
    // Enable CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

    // Only accept GET requests
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ 
                success: false, 
                error: 'Method not allowed. Use GET.' 
            })
        };
    }

    try {
        // Basic authentication check (you should implement proper auth)
        const authHeader = event.headers.authorization || '';
        const adminSecret = process.env.ADMIN_SECRET || 'your-secret-key-here';
        
        if (!authHeader.includes(adminSecret)) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    error: 'Unauthorized. Admin access required.' 
                })
            };
        }

        // Get query parameters
        const { limit = '50', offset = '0', type = '', since = '' } = event.queryStringParameters || {};

        // Retrieve feedback from storage
        const feedback = await getFeedbackFromStorage();
        
        // Filter feedback based on parameters
        let filteredFeedback = feedback;
        
        if (type) {
            filteredFeedback = filteredFeedback.filter(item => item.type === type);
        }
        
        if (since) {
            const sinceDate = new Date(since);
            filteredFeedback = filteredFeedback.filter(item => new Date(item.timestamp) >= sinceDate);
        }
        
        // Sort by timestamp (newest first)
        filteredFeedback.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Apply pagination
        const startIndex = parseInt(offset);
        const endIndex = startIndex + parseInt(limit);
        const paginatedFeedback = filteredFeedback.slice(startIndex, endIndex);
        
        // Generate stats
        const stats = generateStats(feedback);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                success: true,
                data: paginatedFeedback,
                stats: stats,
                total: filteredFeedback.length,
                offset: startIndex,
                limit: parseInt(limit)
            })
        };

    } catch (error) {
        console.error('Get feedback error:', error);
        
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

async function getFeedbackFromStorage() {
    const feedback = [];
    
    try {
        // Try to read from file storage
        const feedbackFile = '/tmp/feedback/submissions.json';
        const data = await fs.readFile(feedbackFile, 'utf8');
        const fileFeedback = JSON.parse(data);
        feedback.push(...fileFeedback);
    } catch (error) {
        console.log('No feedback file found or error reading it');
    }
    
    // You could also retrieve from other sources here:
    // - Database
    // - External API
    // - Environment variables
    
    return feedback;
}

function generateStats(feedback) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    const monthAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    const stats = {
        total: feedback.length,
        today: feedback.filter(f => new Date(f.timestamp) >= today).length,
        week: feedback.filter(f => new Date(f.timestamp) >= weekAgo).length,
        month: feedback.filter(f => new Date(f.timestamp) >= monthAgo).length,
        by_type: {},
        recent_trends: {}
    };
    
    // Count by type
    feedback.forEach(item => {
        stats.by_type[item.type] = (stats.by_type[item.type] || 0) + 1;
    });
    
    // Recent trends (last 7 days)
    for (let i = 0; i < 7; i++) {
        const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
        const dateString = date.toISOString().split('T')[0];
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayEnd = new Date(dayStart.getTime() + (24 * 60 * 60 * 1000));
        
        stats.recent_trends[dateString] = feedback.filter(f => {
            const feedbackDate = new Date(f.timestamp);
            return feedbackDate >= dayStart && feedbackDate < dayEnd;
        }).length;
    }
    
    return stats;
}