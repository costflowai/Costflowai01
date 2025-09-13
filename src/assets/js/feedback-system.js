/**
 * CostFlowAI Feedback Collection System
 * Comprehensive user feedback collection with special focus on cancellation feedback
 */

class FeedbackSystem {
    constructor(options = {}) {
        this.apiEndpoint = options.apiEndpoint || '/api/feedback.php';
        this.debug = options.debug || false;
        
        // Feedback types
        this.feedbackTypes = {
            GENERAL: 'general',
            FEATURE_REQUEST: 'feature_request',
            BUG_REPORT: 'bug_report',
            CANCELLATION: 'cancellation',
            TRIAL_FEEDBACK: 'trial_feedback',
            CALCULATOR_FEEDBACK: 'calculator_feedback'
        };
        
        // Cancellation reasons
        this.cancellationReasons = {
            TOO_EXPENSIVE: 'too_expensive',
            NOT_ENOUGH_VALUE: 'not_enough_value',
            MISSING_FEATURES: 'missing_features',
            TOO_COMPLEX: 'too_complex',
            FOUND_ALTERNATIVE: 'found_alternative',
            TEMPORARY_NEED: 'temporary_need',
            TECHNICAL_ISSUES: 'technical_issues',
            OTHER: 'other'
        };
        
        this.init();
    }

    init() {
        this.setupFeedbackTriggers();
        this.setupCancellationFlow();
        this.setupTrialFeedback();
        this.log('Feedback system initialized');
    }

    /**
     * Show general feedback modal
     */
    showFeedbackModal(type = this.feedbackTypes.GENERAL, context = {}) {
        const modal = this.createFeedbackModal(type, context);
        document.body.appendChild(modal);
        
        // Track feedback modal shown
        this.trackEvent('feedback_modal_shown', { type, context });
    }

    /**
     * Show cancellation feedback flow
     */
    showCancellationFeedback(subscriptionData = {}) {
        const modal = this.createCancellationModal(subscriptionData);
        document.body.appendChild(modal);
        
        // Track cancellation flow initiated
        this.trackEvent('cancellation_flow_started', {
            subscription_id: subscriptionData.id,
            plan: subscriptionData.plan,
            days_active: subscriptionData.daysActive
        });
    }

    /**
     * Show trial ending feedback
     */
    showTrialFeedback(trialData = {}) {
        const modal = this.createTrialFeedbackModal(trialData);
        document.body.appendChild(modal);
        
        this.trackEvent('trial_feedback_shown', {
            trial_days_used: trialData.daysUsed || 7,
            calculations_made: trialData.calculationsMade || 0
        });
    }

    /**
     * Create general feedback modal
     */
    createFeedbackModal(type, context) {
        const modal = document.createElement('div');
        modal.className = 'feedback-modal-overlay';
        modal.innerHTML = `
            <div class="feedback-modal">
                <div class="modal-header">
                    <h3>💬 Share Your Feedback</h3>
                    <button class="modal-close" onclick="this.closest('.feedback-modal-overlay').remove()">×</button>
                </div>
                <div class="modal-body">
                    <form class="feedback-form" onsubmit="return feedbackSystem.submitFeedback(event, '${type}')">
                        ${this.getFeedbackFormContent(type)}
                    </form>
                </div>
            </div>
        `;
        
        this.applyModalStyles(modal);
        return modal;
    }

    /**
     * Create cancellation feedback modal
     */
    createCancellationModal(subscriptionData) {
        const modal = document.createElement('div');
        modal.className = 'feedback-modal-overlay cancellation-modal';
        modal.innerHTML = `
            <div class="feedback-modal large">
                <div class="modal-header">
                    <h3>😔 We're sorry to see you go</h3>
                    <p>Help us improve CostFlowAI for future users</p>
                </div>
                <div class="modal-body">
                    <form class="feedback-form cancellation-form" onsubmit="return feedbackSystem.submitCancellationFeedback(event)">
                        <div class="feedback-section">
                            <h4>Why are you cancelling? (Select all that apply)</h4>
                            <div class="checkbox-group">
                                <label class="checkbox-item">
                                    <input type="checkbox" name="reason" value="${this.cancellationReasons.TOO_EXPENSIVE}">
                                    <span>💰 Too expensive for my needs</span>
                                </label>
                                <label class="checkbox-item">
                                    <input type="checkbox" name="reason" value="${this.cancellationReasons.NOT_ENOUGH_VALUE}">
                                    <span>📉 Not getting enough value</span>
                                </label>
                                <label class="checkbox-item">
                                    <input type="checkbox" name="reason" value="${this.cancellationReasons.MISSING_FEATURES}">
                                    <span>🔧 Missing features I need</span>
                                </label>
                                <label class="checkbox-item">
                                    <input type="checkbox" name="reason" value="${this.cancellationReasons.TOO_COMPLEX}">
                                    <span>🤯 Too complex to use</span>
                                </label>
                                <label class="checkbox-item">
                                    <input type="checkbox" name="reason" value="${this.cancellationReasons.FOUND_ALTERNATIVE}">
                                    <span>🔄 Found a better alternative</span>
                                </label>
                                <label class="checkbox-item">
                                    <input type="checkbox" name="reason" value="${this.cancellationReasons.TEMPORARY_NEED}">
                                    <span>⏰ Only needed it temporarily</span>
                                </label>
                                <label class="checkbox-item">
                                    <input type="checkbox" name="reason" value="${this.cancellationReasons.TECHNICAL_ISSUES}">
                                    <span>🐛 Technical issues/bugs</span>
                                </label>
                                <label class="checkbox-item">
                                    <input type="checkbox" name="reason" value="${this.cancellationReasons.OTHER}">
                                    <span>📝 Other (please specify below)</span>
                                </label>
                            </div>
                        </div>

                        <div class="feedback-section">
                            <h4>What specific improvements would make you reconsider?</h4>
                            <textarea name="improvements" placeholder="Tell us what features, pricing changes, or improvements would make CostFlowAI more valuable for you..." rows="3"></textarea>
                        </div>

                        <div class="feedback-section">
                            <h4>Additional comments</h4>
                            <textarea name="additional_comments" placeholder="Any other feedback to help us improve..." rows="3"></textarea>
                        </div>

                        <div class="feedback-section">
                            <h4>Alternative you're switching to (optional)</h4>
                            <input type="text" name="alternative" placeholder="e.g. RS Means, BuildingConnected, etc.">
                        </div>

                        <div class="rating-section">
                            <h4>Overall experience rating</h4>
                            <div class="star-rating">
                                ${[5,4,3,2,1].map(star => `
                                    <label class="star-item">
                                        <input type="radio" name="rating" value="${star}">
                                        <span class="star">⭐</span>
                                        <span class="rating-label">${this.getRatingLabel(star)}</span>
                                    </label>
                                `).join('')}
                            </div>
                        </div>

                        <div class="retention-offer">
                            <div class="offer-box">
                                <h4>🎁 Wait! Before you go...</h4>
                                <p>We'd love to keep you as a customer. Would any of these help?</p>
                                <div class="offer-options">
                                    <label class="offer-item">
                                        <input type="radio" name="retention_offer" value="discount_50">
                                        <span>💰 50% discount for 3 months ($${Math.round(subscriptionData.price / 2) || 5}/month)</span>
                                    </label>
                                    <label class="offer-item">
                                        <input type="radio" name="retention_offer" value="pause_subscription">
                                        <span>⏸️ Pause subscription for up to 3 months</span>
                                    </label>
                                    <label class="offer-item">
                                        <input type="radio" name="retention_offer" value="feature_preview">
                                        <span>👀 Free access to upcoming premium features</span>
                                    </label>
                                    <label class="offer-item">
                                        <input type="radio" name="retention_offer" value="personal_demo">
                                        <span>👨‍💼 Personal demo with our product team</span>
                                    </label>
                                    <label class="offer-item">
                                        <input type="radio" name="retention_offer" value="none">
                                        <span>❌ No thanks, proceed with cancellation</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div class="form-actions">
                            <button type="button" class="btn-secondary" onclick="this.closest('.feedback-modal-overlay').remove()">
                                Keep My Subscription
                            </button>
                            <button type="submit" class="btn-danger">
                                Submit Feedback & Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        this.applyModalStyles(modal);
        this.applyCancellationStyles(modal);
        return modal;
    }

    /**
     * Create trial feedback modal
     */
    createTrialFeedbackModal(trialData) {
        const modal = document.createElement('div');
        modal.className = 'feedback-modal-overlay trial-feedback';
        modal.innerHTML = `
            <div class="feedback-modal">
                <div class="modal-header">
                    <h3>🎯 How was your 7-day trial?</h3>
                    <p>Your trial ${trialData.isExpiring ? 'is ending soon' : 'has ended'}. Help us improve!</p>
                </div>
                <div class="modal-body">
                    <form class="feedback-form trial-form" onsubmit="return feedbackSystem.submitTrialFeedback(event)">
                        <div class="trial-stats">
                            <div class="stat">
                                <div class="stat-number">${trialData.calculationsMade || 0}</div>
                                <div class="stat-label">Calculations Made</div>
                            </div>
                            <div class="stat">
                                <div class="stat-number">${trialData.featuresUsed || 0}</div>
                                <div class="stat-label">Features Tried</div>
                            </div>
                            <div class="stat">
                                <div class="stat-number">${trialData.daysUsed || 0}/7</div>
                                <div class="stat-label">Days Used</div>
                            </div>
                        </div>

                        <div class="feedback-section">
                            <h4>Rate your trial experience</h4>
                            <div class="emoji-rating">
                                <label><input type="radio" name="trial_rating" value="5"><span>😍</span> Excellent</label>
                                <label><input type="radio" name="trial_rating" value="4"><span>😊</span> Good</label>
                                <label><input type="radio" name="trial_rating" value="3"><span>😐</span> Okay</label>
                                <label><input type="radio" name="trial_rating" value="2"><span>😞</span> Poor</label>
                                <label><input type="radio" name="trial_rating" value="1"><span>😠</span> Terrible</label>
                            </div>
                        </div>

                        <div class="feedback-section">
                            <h4>What did you like most?</h4>
                            <div class="checkbox-group">
                                <label><input type="checkbox" name="liked" value="accuracy"> Calculation accuracy</label>
                                <label><input type="checkbox" name="liked" value="state_data"> State-specific data</label>
                                <label><input type="checkbox" name="liked" value="exports"> PDF/CSV exports</label>
                                <label><input type="checkbox" name="liked" value="interface"> User interface</label>
                                <label><input type="checkbox" name="liked" value="speed"> Calculation speed</label>
                                <label><input type="checkbox" name="liked" value="features"> Advanced features</label>
                            </div>
                        </div>

                        <div class="feedback-section">
                            <h4>What prevented you from getting more value?</h4>
                            <textarea name="barriers" placeholder="Tell us what challenges you faced or what was missing..." rows="3"></textarea>
                        </div>

                        <div class="feedback-section">
                            <h4>Likelihood to recommend to a colleague?</h4>
                            <div class="nps-scale">
                                ${Array.from({length: 11}, (_, i) => `
                                    <label class="nps-item">
                                        <input type="radio" name="nps" value="${i}">
                                        <span>${i}</span>
                                    </label>
                                `).join('')}
                            </div>
                            <div class="nps-labels">
                                <span>Not at all likely</span>
                                <span>Extremely likely</span>
                            </div>
                        </div>

                        <div class="form-actions">
                            <button type="submit" class="btn-primary">Submit Feedback</button>
                            ${!trialData.isExpiring ? `
                                <button type="button" class="btn-premium" onclick="subscriptionManager.showUpgradeModal()">
                                    Continue with Premium
                                </button>
                            ` : ''}
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        this.applyModalStyles(modal);
        this.applyTrialFeedbackStyles(modal);
        return modal;
    }

    /**
     * Get feedback form content based on type
     */
    getFeedbackFormContent(type) {
        switch (type) {
            case this.feedbackTypes.FEATURE_REQUEST:
                return `
                    <h4>💡 Feature Request</h4>
                    <div class="form-group">
                        <label>What feature would you like to see?</label>
                        <input type="text" name="feature_title" placeholder="Brief title for the feature" required>
                    </div>
                    <div class="form-group">
                        <label>Describe the feature in detail</label>
                        <textarea name="feature_description" placeholder="What should it do? How would it help you?" rows="4" required></textarea>
                    </div>
                    <div class="form-group">
                        <label>Priority for you</label>
                        <select name="priority" required>
                            <option value="low">Nice to have</option>
                            <option value="medium">Would be helpful</option>
                            <option value="high">Really need this</option>
                            <option value="critical">Can't work without it</option>
                        </select>
                    </div>
                    <button type="submit" class="btn-primary">Submit Feature Request</button>
                `;
                
            case this.feedbackTypes.BUG_REPORT:
                return `
                    <h4>🐛 Bug Report</h4>
                    <div class="form-group">
                        <label>What went wrong?</label>
                        <input type="text" name="bug_title" placeholder="Brief description of the issue" required>
                    </div>
                    <div class="form-group">
                        <label>Steps to reproduce</label>
                        <textarea name="bug_steps" placeholder="1. I clicked on...\n2. Then I...\n3. Expected... but got..." rows="4" required></textarea>
                    </div>
                    <div class="form-group">
                        <label>Which calculator/page?</label>
                        <input type="text" name="bug_location" placeholder="e.g. Residential ROM Calculator" required>
                    </div>
                    <div class="form-group">
                        <label>Browser & Device</label>
                        <input type="text" name="bug_environment" placeholder="e.g. Chrome on Windows" value="${navigator.userAgent.substring(0, 50)}...">
                    </div>
                    <button type="submit" class="btn-primary">Report Bug</button>
                `;
                
            case this.feedbackTypes.CALCULATOR_FEEDBACK:
                return `
                    <h4>📊 Calculator Feedback</h4>
                    <div class="form-group">
                        <label>Which calculator?</label>
                        <select name="calculator_id" required>
                            <option value="">Select calculator...</option>
                            <option value="residential-rom">Residential ROM</option>
                            <option value="commercial-ti">Commercial TI</option>
                            <option value="concrete">Concrete</option>
                            <option value="risk-assessment">Risk Assessment Pro</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Accuracy rating</label>
                        <select name="accuracy_rating">
                            <option value="5">Very accurate</option>
                            <option value="4">Mostly accurate</option>
                            <option value="3">Somewhat accurate</option>
                            <option value="2">Not very accurate</option>
                            <option value="1">Completely wrong</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Your feedback</label>
                        <textarea name="calculator_feedback" placeholder="How can we improve this calculator?" rows="4" required></textarea>
                    </div>
                    <button type="submit" class="btn-primary">Submit Feedback</button>
                `;
                
            default:
                return `
                    <h4>💬 General Feedback</h4>
                    <div class="form-group">
                        <label>Category</label>
                        <select name="category">
                            <option value="general">General feedback</option>
                            <option value="suggestion">Suggestion</option>
                            <option value="compliment">Compliment</option>
                            <option value="complaint">Complaint</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Your feedback</label>
                        <textarea name="message" placeholder="We'd love to hear your thoughts..." rows="5" required></textarea>
                    </div>
                    <div class="form-group">
                        <label>Email (optional)</label>
                        <input type="email" name="email" placeholder="If you'd like a response">
                    </div>
                    <button type="submit" class="btn-primary">Send Feedback</button>
                `;
        }
    }

    /**
     * Submit general feedback
     */
    async submitFeedback(event, type) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        
        const feedback = {
            type,
            timestamp: new Date().toISOString(),
            user_id: this.getUserId(),
            data: Object.fromEntries(formData)
        };
        
        try {
            await this.sendFeedback(feedback);
            this.showThankYouMessage('Thank you for your feedback! We appreciate you taking the time to help us improve.');
            form.closest('.feedback-modal-overlay').remove();
            
        } catch (error) {
            this.showErrorMessage('Sorry, there was an issue submitting your feedback. Please try again.');
            this.log(`Feedback submission failed: ${error.message}`, 'error');
        }
        
        return false;
    }

    /**
     * Submit cancellation feedback
     */
    async submitCancellationFeedback(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        
        // Get selected reasons
        const reasons = Array.from(form.querySelectorAll('input[name="reason"]:checked'))
            .map(input => input.value);
        
        const feedback = {
            type: this.feedbackTypes.CANCELLATION,
            timestamp: new Date().toISOString(),
            user_id: this.getUserId(),
            subscription_id: this.getCurrentSubscriptionId(),
            data: {
                reasons,
                improvements: formData.get('improvements'),
                additional_comments: formData.get('additional_comments'),
                alternative: formData.get('alternative'),
                rating: formData.get('rating'),
                retention_offer: formData.get('retention_offer')
            }
        };
        
        try {
            await this.sendFeedback(feedback);
            
            // Handle retention offer
            const retentionOffer = formData.get('retention_offer');
            if (retentionOffer && retentionOffer !== 'none') {
                await this.handleRetentionOffer(retentionOffer);
            } else {
                // Proceed with cancellation
                await this.processCancellation();
            }
            
        } catch (error) {
            this.showErrorMessage('Sorry, there was an issue processing your cancellation. Please contact support.');
            this.log(`Cancellation feedback failed: ${error.message}`, 'error');
        }
        
        return false;
    }

    /**
     * Submit trial feedback
     */
    async submitTrialFeedback(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        
        // Get selected liked features
        const likedFeatures = Array.from(form.querySelectorAll('input[name="liked"]:checked'))
            .map(input => input.value);
        
        const feedback = {
            type: this.feedbackTypes.TRIAL_FEEDBACK,
            timestamp: new Date().toISOString(),
            user_id: this.getUserId(),
            data: {
                trial_rating: formData.get('trial_rating'),
                liked_features: likedFeatures,
                barriers: formData.get('barriers'),
                nps: formData.get('nps')
            }
        };
        
        try {
            await this.sendFeedback(feedback);
            this.showThankYouMessage('Thank you for trying CostFlowAI! Your feedback helps us improve.');
            form.closest('.feedback-modal-overlay').remove();
            
        } catch (error) {
            this.showErrorMessage('Sorry, there was an issue submitting your feedback.');
            this.log(`Trial feedback failed: ${error.message}`, 'error');
        }
        
        return false;
    }

    /**
     * Handle retention offers
     */
    async handleRetentionOffer(offerType) {
        const offers = {
            discount_50: {
                title: '🎉 50% Discount Applied!',
                message: 'We\'ve applied a 50% discount to your next 3 months. Your subscription will continue at the discounted rate.',
                action: 'apply_discount'
            },
            pause_subscription: {
                title: '⏸️ Subscription Paused',
                message: 'We\'ve paused your subscription for up to 3 months. You can reactivate anytime from your account settings.',
                action: 'pause_subscription'
            },
            feature_preview: {
                title: '🚀 Preview Access Granted!',
                message: 'You now have access to upcoming premium features. Check your dashboard for new calculators and tools.',
                action: 'grant_preview_access'
            },
            personal_demo: {
                title: '👨‍💼 Demo Scheduled',
                message: 'Our product team will contact you within 24 hours to schedule a personal demo and discuss your needs.',
                action: 'schedule_demo'
            }
        };
        
        const offer = offers[offerType];
        if (offer) {
            // Show success message
            this.showSuccessMessage(offer.title, offer.message);
            
            // Process retention offer
            await this.processRetentionOffer(offer.action);
            
            // Track retention success
            this.trackEvent('retention_offer_accepted', {
                offer_type: offerType,
                user_id: this.getUserId()
            });
        }
    }

    /**
     * Setup feedback triggers
     */
    setupFeedbackTriggers() {
        // Feedback button in navigation
        this.addFeedbackButton();
        
        // Calculator-specific feedback
        this.setupCalculatorFeedback();
        
        // Page-specific feedback triggers
        this.setupPageTriggers();
    }

    /**
     * Add feedback button to navigation
     */
    addFeedbackButton() {
        const nav = document.querySelector('nav .nav-links');
        if (nav) {
            const feedbackItem = document.createElement('li');
            feedbackItem.innerHTML = `
                <a href="#" onclick="feedbackSystem.showFeedbackModal(); return false;" class="feedback-link">
                    💬 Feedback
                </a>
            `;
            nav.appendChild(feedbackItem);
        }
    }

    /**
     * Setup calculator-specific feedback
     */
    setupCalculatorFeedback() {
        // Add feedback buttons to calculator result sections
        document.addEventListener('DOMContentLoaded', () => {
            const resultSections = document.querySelectorAll('#results, .calculation-results');
            resultSections.forEach(section => {
                if (!section.querySelector('.calculator-feedback-btn')) {
                    const feedbackBtn = document.createElement('button');
                    feedbackBtn.className = 'btn-secondary calculator-feedback-btn';
                    feedbackBtn.innerHTML = '📊 Rate This Calculator';
                    feedbackBtn.onclick = () => {
                        this.showFeedbackModal(this.feedbackTypes.CALCULATOR_FEEDBACK, {
                            calculator_id: this.getCurrentCalculatorId()
                        });
                    };
                    section.appendChild(feedbackBtn);
                }
            });
        });
    }

    /**
     * Setup cancellation flow triggers
     */
    setupCancellationFlow() {
        // Intercept cancellation attempts
        document.addEventListener('click', (e) => {
            if (e.target.matches('.cancel-subscription, [data-action="cancel"]')) {
                e.preventDefault();
                this.showCancellationFeedback(this.getCurrentSubscriptionData());
            }
        });
    }

    /**
     * Setup trial feedback triggers
     */
    setupTrialFeedback() {
        // Check trial status and show feedback at appropriate times
        if (this.isTrialUser()) {
            const trialData = this.getTrialData();
            
            // Show feedback on day 6 of trial
            if (trialData.daysRemaining === 1) {
                setTimeout(() => {
                    this.showTrialFeedback({ ...trialData, isExpiring: true });
                }, 5000); // Show after 5 seconds on page
            }
            
            // Show feedback when trial expires
            if (trialData.daysRemaining <= 0) {
                setTimeout(() => {
                    this.showTrialFeedback(trialData);
                }, 2000);
            }
        }
    }

    /**
     * Send feedback to Google Sheets via secure integration
     */
    async sendFeedback(feedback) {
        try {
            // Primary: Send to Google Sheets
            if (window.googleSheetsIntegration) {
                const result = await window.googleSheetsIntegration.sendToGoogleSheets(feedback);
                this.log('Feedback sent to Google Sheets successfully');
                return result;
            }
            
            // Fallback: Try direct API
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(feedback)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            this.log('Feedback sent via API successfully');
            return result;
            
        } catch (error) {
            // Final fallback to localStorage
            this.saveFeedbackLocally(feedback);
            this.log(`All submission methods failed, saved locally: ${error.message}`, 'warn');
            
            // Re-throw for user notification
            throw error;
        }
    }

    /**
     * Save feedback locally as fallback
     */
    saveFeedbackLocally(feedback) {
        const stored = JSON.parse(localStorage.getItem('costflowai_feedback') || '[]');
        stored.push(feedback);
        
        // Keep only last 50 feedback items
        if (stored.length > 50) {
            stored.splice(0, stored.length - 50);
        }
        
        localStorage.setItem('costflowai_feedback', JSON.stringify(stored));
    }

    /**
     * Utility functions
     */
    getUserId() {
        return localStorage.getItem('costflowai_user_id') || 'anonymous';
    }

    getCurrentSubscriptionId() {
        const subscription = JSON.parse(localStorage.getItem('costflowai_subscription') || '{}');
        return subscription.id || null;
    }

    getCurrentSubscriptionData() {
        const subscription = JSON.parse(localStorage.getItem('costflowai_subscription') || '{}');
        return {
            id: subscription.id,
            plan: subscription.plan,
            price: subscription.plan === 'premium' ? 19 : subscription.plan === 'professional' ? 49 : 199,
            daysActive: subscription.created ? Math.floor((Date.now() - new Date(subscription.created).getTime()) / (1000 * 60 * 60 * 24)) : 0
        };
    }

    getCurrentCalculatorId() {
        // Try to detect current calculator from URL or page content
        const path = window.location.pathname;
        if (path.includes('residential')) return 'residential-rom';
        if (path.includes('commercial')) return 'commercial-ti';
        if (path.includes('concrete')) return 'concrete';
        if (path.includes('risk')) return 'risk-assessment';
        return 'unknown';
    }

    isTrialUser() {
        const subscription = JSON.parse(localStorage.getItem('costflowai_subscription') || '{}');
        return subscription.status === 'trialing';
    }

    getTrialData() {
        const subscription = JSON.parse(localStorage.getItem('costflowai_subscription') || '{}');
        if (!subscription.trial_end) return null;
        
        const trialEnd = new Date(subscription.trial_end);
        const now = new Date();
        const daysRemaining = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
        const daysUsed = 7 - daysRemaining;
        
        // Get usage stats
        const usage = JSON.parse(localStorage.getItem('costflowai_usage_' + new Date().toDateString()) || '{}');
        
        return {
            daysRemaining: Math.max(0, daysRemaining),
            daysUsed: Math.max(0, Math.min(7, daysUsed)),
            calculationsMade: usage.daily_calculations || 0,
            featuresUsed: Object.keys(usage.feature_usage || {}).length
        };
    }

    getRatingLabel(rating) {
        const labels = {
            5: 'Excellent',
            4: 'Good', 
            3: 'Average',
            2: 'Poor',
            1: 'Terrible'
        };
        return labels[rating] || '';
    }

    showThankYouMessage(message) {
        this.showNotification('Thank You!', message, 'success');
    }

    showSuccessMessage(title, message) {
        this.showNotification(title, message, 'success');
    }

    showErrorMessage(message) {
        this.showNotification('Error', message, 'error');
    }

    showNotification(title, message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `feedback-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <h4>${title}</h4>
                <p>${message}</p>
                <button onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 10002;
            background: white; border-radius: 8px; padding: 20px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            max-width: 350px; border-left: 4px solid ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        `;
        
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 5000);
    }

    applyModalStyles(modal) {
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.7); z-index: 10001;
            display: flex; align-items: center; justify-content: center;
        `;
        
        const modalContent = modal.querySelector('.feedback-modal');
        modalContent.style.cssText = `
            background: white; border-radius: 12px; max-width: 600px;
            width: 90%; max-height: 90vh; overflow-y: auto;
        `;
    }

    applyCancellationStyles(modal) {
        const styles = document.createElement('style');
        styles.textContent = `
            .cancellation-modal .checkbox-item {
                display: flex; align-items: center; padding: 12px;
                border: 1px solid #e5e7eb; border-radius: 8px; margin: 8px 0;
                cursor: pointer; transition: all 0.2s;
            }
            .cancellation-modal .checkbox-item:hover {
                background: #f9fafb; border-color: #d1d5db;
            }
            .cancellation-modal .checkbox-item input {
                margin-right: 12px;
            }
            .retention-offer { margin: 20px 0; }
            .offer-box {
                background: #f0f9ff; border: 1px solid #bfdbfe;
                border-radius: 8px; padding: 20px;
            }
            .offer-item {
                display: block; padding: 8px 0; cursor: pointer;
            }
            .star-rating { display: flex; gap: 10px; }
            .star-item { cursor: pointer; }
            .btn-danger {
                background: #dc2626; color: white; border: none;
                padding: 12px 24px; border-radius: 6px; cursor: pointer;
            }
        `;
        document.head.appendChild(styles);
    }

    applyTrialFeedbackStyles(modal) {
        const styles = document.createElement('style');
        styles.textContent = `
            .trial-stats {
                display: flex; justify-content: space-around;
                background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;
            }
            .stat { text-align: center; }
            .stat-number {
                font-size: 2rem; font-weight: bold; color: #0066ff;
            }
            .stat-label {
                font-size: 0.9rem; color: #666; margin-top: 5px;
            }
            .emoji-rating {
                display: flex; gap: 15px; justify-content: center; margin: 15px 0;
            }
            .emoji-rating label {
                text-align: center; cursor: pointer; padding: 10px;
                border-radius: 8px; transition: background 0.2s;
            }
            .emoji-rating label:hover {
                background: #f3f4f6;
            }
            .emoji-rating span {
                font-size: 1.5rem; display: block; margin-bottom: 5px;
            }
            .nps-scale {
                display: flex; gap: 5px; justify-content: center; margin: 10px 0;
            }
            .nps-item {
                text-align: center; cursor: pointer; padding: 5px;
                border: 1px solid #d1d5db; border-radius: 4px; min-width: 30px;
            }
            .nps-labels {
                display: flex; justify-content: space-between;
                font-size: 0.8rem; color: #666; margin-top: 10px;
            }
        `;
        document.head.appendChild(styles);
    }

    trackEvent(event, properties = {}) {
        if (window.analytics && window.analytics.track) {
            window.analytics.track(event, properties);
        }
    }

    log(message, level = 'info') {
        if (this.debug) {
            console[level](`[Feedback] ${message}`);
        }
    }

    // Public API for external use
    processCancellation() {
        return new Promise((resolve) => {
            setTimeout(() => {
                this.showSuccessMessage(
                    'Subscription Cancelled',
                    'Your subscription has been cancelled. You\'ll retain access until the end of your billing period. We hope to see you back soon!'
                );
                resolve();
            }, 1000);
        });
    }

    processRetentionOffer(action) {
        return new Promise((resolve) => {
            setTimeout(() => {
                this.log(`Processing retention offer: ${action}`);
                resolve();
            }, 500);
        });
    }
}

// Initialize feedback system
document.addEventListener('DOMContentLoaded', () => {
    window.feedbackSystem = new FeedbackSystem({
        debug: window.location.hostname === 'localhost'
    });
});

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FeedbackSystem;
}