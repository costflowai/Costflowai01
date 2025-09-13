// Netlify Function: Create Stripe Checkout Session
// File: /netlify/functions/create-checkout-session.js

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
    // Enable CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
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
        const { customerEmail, couponId } = JSON.parse(event.body);
        
        // Use price ID from environment variables
        const priceId = process.env.STRIPE_PRICE_ID;

        // Validate required fields
        if (!priceId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'STRIPE_PRICE_ID not configured in environment variables' })
            };
        }

        // Create checkout session configuration
        const sessionConfig = {
            payment_method_types: ['card'],
            mode: 'subscription',
            line_items: [
                {
                    price: priceId, // Your monthly subscription price ID
                    quantity: 1,
                }
            ],
            // Apply 50% off coupon for first month
            discounts: couponId ? [{ coupon: couponId }] : [],
            
            // Success and cancel URLs
            success_url: `${process.env.URL || 'https://costflowai.com'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.URL || 'https://costflowai.com'}/pricing?canceled=true`,
            
            // Customer configuration
            customer_email: customerEmail,
            
            // Subscription configuration
            subscription_data: {
                metadata: {
                    source: 'CostFlowAI Website',
                    plan: 'Pro Monthly'
                }
            },
            
            // Additional options
            allow_promotion_codes: true, // Allow users to enter additional promo codes
            billing_address_collection: 'required',
            
            // Custom metadata
            metadata: {
                product: 'CostFlowAI Pro',
                source: 'website_checkout'
            }
        };

        // Create the checkout session
        const session = await stripe.checkout.sessions.create(sessionConfig);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                id: session.id,
                url: session.url
            })
        };

    } catch (error) {
        console.error('Stripe checkout error:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Failed to create checkout session',
                details: error.message 
            })
        };
    }
};

// Alternative Node.js Express implementation (if not using Netlify)
/*
const express = require('express');
const app = express();

app.use(express.json());

app.post('/api/create-checkout-session', async (req, res) => {
    try {
        const { customerEmail, priceId, couponId } = req.body;
        
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'subscription',
            line_items: [{
                price: priceId,
                quantity: 1,
            }],
            discounts: couponId ? [{ coupon: couponId }] : [],
            success_url: 'https://costflowai.com/payment-success?session_id={CHECKOUT_SESSION_ID}',
            cancel_url: 'https://costflowai.com/pricing?canceled=true',
            customer_email: customerEmail,
            allow_promotion_codes: true,
            billing_address_collection: 'required'
        });

        res.json({ id: session.id, url: session.url });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000);
*/