/**
 * Netlify Function: Track Usage Server-Side
 * Provides server-side tracking to prevent bypass attempts
 * 
 * Endpoints:
 * - POST /track - Track a calculator usage
 * - POST /sync - Sync usage data with client
 * - POST /reset - Reset usage counter
 */

const { createHash } = require('crypto');

// Simple in-memory storage (in production, use a database)
// For Netlify Functions, consider using FaunaDB, Airtable, or similar
let usageStore = new Map();

// Configuration
const FREE_LIMIT = 5;
const RESET_PERIOD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

/**
 * Generate a consistent user identifier
 */
function generateUserId(email, fingerprint, ip) {
    const identifier = email || `${fingerprint}_${ip}`;
    return createHash('sha256').update(identifier).digest('hex').substring(0, 16);
}

/**
 * Get user usage data
 */
function getUserUsage(userId) {
    const data = usageStore.get(userId);
    if (!data) {
        return {
            userId,
            count: 0,
            weekStart: Date.now(),
            history: [],
            fingerprints: new Set(),
            ips: new Set()
        };
    }
    
    // Check if reset is needed
    const now = Date.now();
    if ((now - data.weekStart) > RESET_PERIOD_MS) {
        return {
            userId,
            count: 0,
            weekStart: now,
            history: [],
            fingerprints: data.fingerprints,
            ips: data.ips
        };
    }
    
    return data;
}

/**
 * Save user usage data
 */
function saveUserUsage(userId, data) {
    usageStore.set(userId, {
        ...data,
        lastUpdated: Date.now()
    });
}

/**
 * Detect suspicious activity
 */
function detectSuspiciousActivity(userData, fingerprint, ip) {
    const suspiciousIndicators = [];
    
    // Multiple fingerprints from same user
    if (userData.fingerprints && userData.fingerprints.size > 3) {
        suspiciousIndicators.push('multiple_devices');
    }
    
    // Multiple IPs (could be VPN hopping)
    if (userData.ips && userData.ips.size > 2) {
        suspiciousIndicators.push('multiple_ips');
    }
    
    // Rapid usage pattern (more than 1 per minute for 5 minutes)
    const recentHistory = userData.history.filter(h => 
        (Date.now() - h.timestamp) < (5 * 60 * 1000)
    );
    if (recentHistory.length >= 5) {
        suspiciousIndicators.push('rapid_usage');
    }
    
    return suspiciousIndicators;
}

/**
 * Check if user has active subscription
 * In production, integrate with Stripe API
 */
async function hasActiveSubscription(email) {
    if (!email) return false;
    
    // TODO: Integrate with Stripe API to check subscription status
    // For now, return false (everyone is on free plan)
    
    try {
        // Example Stripe integration:
        /*
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        const customers = await stripe.customers.list({
            email: email,
            limit: 1
        });
        
        if (customers.data.length > 0) {
            const customer = customers.data[0];
            const subscriptions = await stripe.subscriptions.list({
                customer: customer.id,
                status: 'active',
                limit: 1
            });
            
            return subscriptions.data.length > 0;
        }
        */
        
        return false;
    } catch (error) {
        console.error('Error checking subscription:', error);
        return false;
    }
}

exports.handler = async (event, context) => {
    // CORS headers
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
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const body = JSON.parse(event.body);
        const { action, email, fingerprint, calculatorType, localData } = body;
        
        // Get client IP
        const clientIP = event.headers['x-forwarded-for'] || 
                        event.headers['x-real-ip'] || 
                        context.clientContext?.identity?.source_ip || 
                        'unknown';
        
        // Generate user ID
        const userId = generateUserId(email, fingerprint, clientIP);
        
        // Get current usage data
        let userData = getUserUsage(userId);
        
        // Add fingerprint and IP to tracking
        if (!userData.fingerprints) userData.fingerprints = new Set();
        if (!userData.ips) userData.ips = new Set();
        
        userData.fingerprints.add(fingerprint);
        userData.ips.add(clientIP);
        
        // Check for subscription first
        const hasSubscription = await hasActiveSubscription(email);
        
        switch (action) {
            case 'track':
                // If user has active subscription, allow unlimited usage
                if (hasSubscription) {
                    return {
                        statusCode: 200,
                        headers,
                        body: JSON.stringify({ 
                            allowed: true, 
                            count: 0, 
                            hasSubscription: true 
                        })
                    };
                }
                
                // Detect suspicious activity
                const suspicious = detectSuspiciousActivity(userData, fingerprint, clientIP);
                
                // If suspicious, be more restrictive
                const effectiveLimit = suspicious.length > 0 ? Math.max(1, FREE_LIMIT - suspicious.length) : FREE_LIMIT;
                
                // Check if limit reached
                if (userData.count >= effectiveLimit) {
                    return {
                        statusCode: 200,
                        headers,
                        body: JSON.stringify({ 
                            allowed: false, 
                            count: userData.count, 
                            limit: effectiveLimit,
                            suspicious: suspicious 
                        })
                    };
                }
                
                // Track the usage
                userData.count++;
                userData.history.push({
                    timestamp: Date.now(),
                    calculator: calculatorType || 'unknown',
                    fingerprint: fingerprint,
                    ip: clientIP
                });
                
                // Keep only recent history (last 24 hours)
                userData.history = userData.history.filter(h => 
                    (Date.now() - h.timestamp) < (24 * 60 * 60 * 1000)
                );
                
                saveUserUsage(userId, userData);
                
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ 
                        allowed: true, 
                        count: userData.count, 
                        limit: effectiveLimit 
                    })
                };
                
            case 'sync':
                // Merge local data with server data (server takes precedence for security)
                if (localData && localData.count > userData.count) {
                    // Only sync up if difference is reasonable (prevent manipulation)
                    const maxAllowedDiff = 2;
                    if ((localData.count - userData.count) <= maxAllowedDiff) {
                        userData.count = localData.count;
                        saveUserUsage(userId, userData);
                    }
                }
                
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ 
                        count: userData.count, 
                        weekStart: userData.weekStart,
                        hasSubscription: hasSubscription 
                    })
                };
                
            case 'reset':
                // Reset usage counter
                userData.count = 0;
                userData.weekStart = Date.now();
                userData.history = [];
                
                saveUserUsage(userId, userData);
                
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ 
                        success: true, 
                        count: 0 
                    })
                };
                
            default:
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Invalid action' })
                };
        }

    } catch (error) {
        console.error('Track usage error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Internal server error',
                details: error.message 
            })
        };
    }
};

// Helper function to clean up old data periodically
// In production, run this as a separate scheduled function
function cleanupOldData() {
    const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days
    
    for (const [userId, data] of usageStore.entries()) {
        if (data.lastUpdated < cutoff) {
            usageStore.delete(userId);
        }
    }
    
    console.log(`Cleaned up old data. Active users: ${usageStore.size}`);
}