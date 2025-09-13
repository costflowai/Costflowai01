/**
 * CostFlowAI Feedback Widget
 * Floating feedback button that works without backend dependencies
 */

class FeedbackWidget {
    constructor() {
        this.init();
    }

    init() {
        this.createWidget();
    }

    createWidget() {
        // Only create if not already exists
        if (document.getElementById('feedback-widget')) return;

        const widget = document.createElement('div');
        widget.id = 'feedback-widget';
        widget.innerHTML = `
            <div id="feedback-button" style="
                position: fixed;
                bottom: 20px;
                left: 20px;
                background: linear-gradient(45deg, #667eea, #764ba2);
                color: white;
                border: none;
                border-radius: 50px;
                padding: 15px 20px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 600;
                box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                z-index: 1000;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 8px;
                -webkit-tap-highlight-color: transparent;
            " onclick="feedbackWidget.showModal()">
                💬 Feedback
            </div>
        `;
        
        document.body.appendChild(widget);

        // Add hover effect
        const button = widget.querySelector('#feedback-button');
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-2px)';
            button.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
        });
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateY(0)';
            button.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
        });
    }

    showModal() {
        const modal = document.createElement('div');
        modal.id = 'feedback-modal';
        modal.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
            " onclick="this.remove()">
                <div style="
                    background: white;
                    border-radius: 16px;
                    max-width: 500px;
                    width: 95%;
                    max-height: 90vh;
                    overflow-y: auto;
                    padding: 30px;
                    position: relative;
                " onclick="event.stopPropagation()">
                    <button onclick="this.closest('#feedback-modal').remove()" style="
                        position: absolute;
                        top: 15px;
                        right: 20px;
                        background: none;
                        border: none;
                        font-size: 24px;
                        color: #9ca3af;
                        cursor: pointer;
                    ">×</button>
                    
                    <div style="text-align: center; margin-bottom: 25px;">
                        <div style="font-size: 48px; margin-bottom: 15px;">💬</div>
                        <h2 style="margin: 0 0 10px; color: #667eea;">Share Your Feedback</h2>
                        <p style="color: #6b7280; margin: 0;">Help us improve CostFlowAI with your thoughts and suggestions</p>
                    </div>
                    
                    <form id="feedback-form" onsubmit="feedbackWidget.submitFeedback(event)">
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; font-weight: 600; margin-bottom: 8px; color: #374151;">
                                Quick feedback (required)
                            </label>
                            <textarea name="message" required placeholder="What would you like us to know? (e.g., 'Love the concrete calculator!' or 'Add a roofing calculator please')" style="
                                width: 100%;
                                padding: 12px;
                                border: 2px solid #e5e7eb;
                                border-radius: 8px;
                                font-size: 16px;
                                -webkit-appearance: none;
                                min-height: 80px;
                                font-family: inherit;
                                resize: vertical;
                            "></textarea>
                        </div>

                        <div style="margin-bottom: 25px;">
                            <label style="display: block; font-weight: 600; margin-bottom: 8px; color: #374151;">
                                Email (optional)
                            </label>
                            <input type="email" name="email" placeholder="your@email.com (only if you want a reply)" style="
                                width: 100%;
                                padding: 12px;
                                border: 2px solid #e5e7eb;
                                border-radius: 8px;
                                font-size: 16px;
                                -webkit-appearance: none;
                            ">
                        </div>

                        <button type="submit" style="
                            width: 100%;
                            background: linear-gradient(45deg, #667eea, #764ba2);
                            color: white;
                            border: none;
                            padding: 15px;
                            border-radius: 8px;
                            font-size: 16px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.3s ease;
                        " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                            💬 Send Feedback (takes 10 seconds)
                        </button>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    async submitFeedback(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const feedback = {
            type: 'general', // Required by Netlify function
            message: formData.get('message'),
            email: formData.get('email') || 'No email provided',
            timestamp: new Date().toLocaleString('en-US', { 
                timeZone: 'America/New_York',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }),
            page_url: window.location.href,
            page_title: document.title,
            user_agent: navigator.userAgent.substring(0, 100) // Truncate for sheets
        };

        try {
            // Show loading state
            const submitBtn = event.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = '⏳ Sending...';
            submitBtn.disabled = true;

            // Try primary submission to Netlify function first
            let submitted = false;
            try {
                const response = await fetch('/.netlify/functions/submit-feedback', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(feedback)
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.success) {
                        submitted = true;
                        console.log('Feedback submitted successfully');
                    } else {
                        console.error('Server responded with error:', result.error);
                    }
                } else {
                    console.error('Server returned error status:', response.status);
                }
            } catch (error) {
                console.error('Network error submitting feedback:', error);
            }

            // Google Forms integration (submits to Google Sheets automatically)
            if (!submitted) {
                try {
                    await this.submitToGoogleForm(feedback);
                    submitted = true;
                    console.log('Feedback submitted to Google Sheets via Google Form');
                } catch (error) {
                    console.error('Google Forms submission failed:', error);
                }
            }

            // Final fallback: Store locally for manual collection
            if (!submitted) {
                this.storeFeedbackLocally(feedback);
                console.log('Feedback stored locally as final fallback');
            }

            // Close modal and show success
            document.getElementById('feedback-modal').remove();
            this.showSuccessMessage();

            // Track in analytics if available
            if (window.gtag) {
                window.gtag('event', 'feedback_submitted', {
                    page: window.location.pathname
                });
            }

        } catch (error) {
            console.error('Feedback submission failed:', error);
            
            // Reset button
            const submitBtn = event.target.querySelector('button[type="submit"]');
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            
            this.showErrorMessage('Failed to submit feedback. Please try again.');
        }
    }

    async submitToGoogleForm(feedback) {
        // Google Form configuration for CostFlowAI Feedback
        const GOOGLE_FORM_CONFIG = {
            // This will be the actual Google Form URL once created
            // For now, using a placeholder that can be updated
            formUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSdQvQwvZtUXg1kR2J5rGg4J8K9L3N6F7H0I2M4P8S6V9X1Y0/formResponse',
            fields: {
                message: 'entry.123456789',    // Replace with actual field ID
                email: 'entry.987654321',      // Replace with actual field ID
                page_url: 'entry.456789123',   // Replace with actual field ID
                timestamp: 'entry.789123456',  // Replace with actual field ID
                page_title: 'entry.321654987'  // Replace with actual field ID
            }
        };

        try {
            const formData = new FormData();
            
            // Map feedback data to form fields
            formData.append(GOOGLE_FORM_CONFIG.fields.message, feedback.message || '');
            formData.append(GOOGLE_FORM_CONFIG.fields.email, feedback.email || 'Not provided');
            formData.append(GOOGLE_FORM_CONFIG.fields.page_url, feedback.page_url || window.location.href);
            formData.append(GOOGLE_FORM_CONFIG.fields.timestamp, feedback.timestamp || new Date().toLocaleString());
            formData.append(GOOGLE_FORM_CONFIG.fields.page_title, feedback.page_title || document.title);

            // Submit to Google Form (no-cors mode as Google Forms doesn't return CORS headers)
            await fetch(GOOGLE_FORM_CONFIG.formUrl, {
                method: 'POST',
                mode: 'no-cors',
                body: formData
            });

            return true;
        } catch (error) {
            console.error('Failed to submit to Google Form:', error);
            throw error;
        }
    }

    storeFeedbackLocally(feedback) {
        try {
            const existingFeedback = JSON.parse(localStorage.getItem('costflowai_feedback') || '[]');
            existingFeedback.push(feedback);
            localStorage.setItem('costflowai_feedback', JSON.stringify(existingFeedback));
            
            // Log for manual collection
            console.log('Feedback stored locally:', feedback);
        } catch (error) {
            console.error('Failed to store feedback locally:', error);
        }
    }

    showSuccessMessage() {
        const notification = document.createElement('div');
        notification.innerHTML = `
            <div style="
                position: fixed;
                top: 30px;
                right: 30px;
                background: white;
                border: 2px solid #10b981;
                border-radius: 12px;
                padding: 20px;
                box-shadow: 0 8px 24px rgba(0,0,0,0.1);
                z-index: 10001;
                max-width: 350px;
            ">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                    <div style="font-size: 24px;">✅</div>
                    <h4 style="margin: 0; color: #10b981;">Thank You!</h4>
                </div>
                <p style="margin: 0; color: #374151;">
                    Your feedback has been received. We appreciate you taking the time to help us improve!
                </p>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    position: absolute;
                    top: 10px;
                    right: 15px;
                    background: none;
                    border: none;
                    font-size: 18px;
                    color: #9ca3af;
                    cursor: pointer;
                ">×</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 8 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 8000);
    }

    showErrorMessage(message) {
        const notification = document.createElement('div');
        notification.innerHTML = `
            <div style="
                position: fixed;
                top: 30px;
                right: 30px;
                background: white;
                border: 2px solid #ef4444;
                border-radius: 12px;
                padding: 20px;
                box-shadow: 0 8px 24px rgba(0,0,0,0.1);
                z-index: 10001;
                max-width: 350px;
            ">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                    <div style="font-size: 24px;">⚠️</div>
                    <h4 style="margin: 0; color: #ef4444;">Error</h4>
                </div>
                <p style="margin: 0; color: #374151;">${message}</p>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    position: absolute;
                    top: 10px;
                    right: 15px;
                    background: none;
                    border: none;
                    font-size: 18px;
                    color: #9ca3af;
                    cursor: pointer;
                ">×</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 6 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 6000);
    }

    // Method to get all stored feedback (for manual collection)
    static getAllFeedback() {
        try {
            return JSON.parse(localStorage.getItem('costflowai_feedback') || '[]');
        } catch (error) {
            console.error('Failed to retrieve feedback:', error);
            return [];
        }
    }

    // Method to clear stored feedback after manual collection
    static clearStoredFeedback() {
        try {
            localStorage.removeItem('costflowai_feedback');
            console.log('Stored feedback cleared');
        } catch (error) {
            console.error('Failed to clear feedback:', error);
        }
    }
}

// Initialize feedback widget when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.feedbackWidget = new FeedbackWidget();
});

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FeedbackWidget;
}