// User Engagement & Retention Tools
class EngagementTools {
    constructor() {
        this.init();
    }
    
    init() {
        this.setupGamification();
        this.setupPushNotifications();
        this.setupProgressTracking();
        this.setupCommunityFeatures();
        this.setupRetentionCampaigns();
    }
    
    // Gamification System
    setupGamification() {
        const gamification = {
            achievements: {
                'first_calculation': { name: 'Getting Started', icon: '🚀', points: 10 },
                'calculator_explorer': { name: 'Calculator Explorer', icon: '🔍', points: 25 },
                'power_user': { name: 'Power User', icon: '⚡', points: 50 },
                'estimation_expert': { name: 'Estimation Expert', icon: '🏆', points: 100 },
                'share_master': { name: 'Share Master', icon: '📢', points: 30 },
                'blog_reader': { name: 'Knowledge Seeker', icon: '📚', points: 20 }
            },
            
            getUserStats() {
                return {
                    totalCalculations: parseInt(localStorage.getItem('total_calculations') || '0'),
                    calculatorsUsed: JSON.parse(localStorage.getItem('calculators_used') || '[]').length,
                    totalPoints: parseInt(localStorage.getItem('total_points') || '0'),
                    achievements: JSON.parse(localStorage.getItem('achievements') || '[]'),
                    streak: parseInt(localStorage.getItem('usage_streak') || '0'),
                    level: this.calculateLevel(parseInt(localStorage.getItem('total_points') || '0'))
                };
            },
            
            calculateLevel(points) {
                return Math.floor(points / 100) + 1;
            },
            
            awardPoints(amount, reason) {
                const currentPoints = parseInt(localStorage.getItem('total_points') || '0');
                const newPoints = currentPoints + amount;
                localStorage.setItem('total_points', newPoints.toString());
                
                this.showPointsNotification(amount, reason);
                this.checkLevelUp(currentPoints, newPoints);
                
                return newPoints;
            },
            
            unlockAchievement(achievementKey) {
                const achievements = JSON.parse(localStorage.getItem('achievements') || '[]');
                if (!achievements.includes(achievementKey)) {
                    achievements.push(achievementKey);
                    localStorage.setItem('achievements', JSON.stringify(achievements));
                    
                    const achievement = this.achievements[achievementKey];
                    this.showAchievementNotification(achievement);
                    this.awardPoints(achievement.points, achievement.name);
                }
            },
            
            checkAchievements() {
                const stats = this.getUserStats();
                
                if (stats.totalCalculations >= 1) this.unlockAchievement('first_calculation');
                if (stats.calculatorsUsed >= 3) this.unlockAchievement('calculator_explorer');
                if (stats.totalCalculations >= 25) this.unlockAchievement('power_user');
                if (stats.totalCalculations >= 100) this.unlockAchievement('estimation_expert');
                
                // Check for shares
                const shares = parseInt(localStorage.getItem('shares_count') || '0');
                if (shares >= 5) this.unlockAchievement('share_master');
                
                // Check blog engagement
                const blogViews = parseInt(localStorage.getItem('blog_views') || '0');
                if (blogViews >= 10) this.unlockAchievement('blog_reader');
            },
            
            showPointsNotification(points, reason) {
                const notification = document.createElement('div');
                notification.className = 'points-notification';
                notification.innerHTML = `
                    <div class="points-content">
                        <span class="points-icon">⭐</span>
                        <span class="points-text">+${points} points for ${reason}!</span>
                    </div>
                `;
                document.body.appendChild(notification);
                
                setTimeout(() => notification.remove(), 3000);
            },
            
            showAchievementNotification(achievement) {
                const notification = document.createElement('div');
                notification.className = 'achievement-notification';
                notification.innerHTML = `
                    <div class="achievement-content">
                        <div class="achievement-icon">${achievement.icon}</div>
                        <div class="achievement-text">
                            <h4>Achievement Unlocked!</h4>
                            <p>${achievement.name}</p>
                        </div>
                    </div>
                `;
                document.body.appendChild(notification);
                
                setTimeout(() => notification.remove(), 5000);
            },
            
            checkLevelUp(oldPoints, newPoints) {
                const oldLevel = this.calculateLevel(oldPoints);
                const newLevel = this.calculateLevel(newPoints);
                
                if (newLevel > oldLevel) {
                    this.showLevelUpNotification(newLevel);
                }
            },
            
            showLevelUpNotification(level) {
                const notification = document.createElement('div');
                notification.className = 'levelup-notification';
                notification.innerHTML = `
                    <div class="levelup-content">
                        <h3>🎉 Level Up!</h3>
                        <p>You're now Level ${level}!</p>
                        <small>Keep using calculators to earn more rewards</small>
                    </div>
                `;
                document.body.appendChild(notification);
                
                setTimeout(() => notification.remove(), 6000);
            },
            
            displayUserStats() {
                const stats = this.getUserStats();
                const statsHTML = `
                    <div class="user-stats-widget" style="position: fixed; top: 100px; right: 20px; background: white; padding: 1rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 1000; min-width: 200px;">
                        <h4>Your Progress</h4>
                        <div class="stat-item">Level: <strong>${stats.level}</strong></div>
                        <div class="stat-item">Points: <strong>${stats.totalPoints}</strong></div>
                        <div class="stat-item">Calculations: <strong>${stats.totalCalculations}</strong></div>
                        <div class="stat-item">Streak: <strong>${stats.streak} days</strong></div>
                        <div class="progress-bar" style="margin: 0.5rem 0;">
                            <div class="progress-fill" style="width: ${(stats.totalPoints % 100)}%; height: 8px; background: #0066ff; border-radius: 4px;"></div>
                        </div>
                        <small>${100 - (stats.totalPoints % 100)} points to next level</small>
                        <button onclick="this.parentElement.style.display='none'" style="position: absolute; top: 5px; right: 8px; background: none; border: none;">×</button>
                    </div>
                `;
                
                // Remove existing widget
                const existing = document.querySelector('.user-stats-widget');
                if (existing) existing.remove();
                
                // Add new widget
                document.body.insertAdjacentHTML('beforeend', statsHTML);
                
                // Auto-hide after 10 seconds
                setTimeout(() => {
                    const widget = document.querySelector('.user-stats-widget');
                    if (widget) widget.style.display = 'none';
                }, 10000);
            }
        };
        
        // Track calculator usage for gamification
        const originalSubmit = HTMLFormElement.prototype.submit;
        HTMLFormElement.prototype.submit = function() {
            if (this.classList.contains('calculator-form')) {
                const total = parseInt(localStorage.getItem('total_calculations') || '0') + 1;
                localStorage.setItem('total_calculations', total.toString());
                
                const calculators = JSON.parse(localStorage.getItem('calculators_used') || '[]');
                const calcType = this.id;
                if (!calculators.includes(calcType)) {
                    calculators.push(calcType);
                    localStorage.setItem('calculators_used', JSON.stringify(calculators));
                }
                
                gamification.checkAchievements();
                gamification.awardPoints(5, 'calculation completed');
            }
            originalSubmit.call(this);
        };
        
        window.Gamification = gamification;
        
        // Show stats on page load for returning users
        if (parseInt(localStorage.getItem('total_calculations') || '0') > 0) {
            setTimeout(() => gamification.displayUserStats(), 2000);
        }
    }
    
    // Push Notifications
    setupPushNotifications() {
        const notifications = {
            async init() {
                if ('serviceWorker' in navigator && 'PushManager' in window) {
                    const registration = await navigator.serviceWorker.ready;
                    const subscription = await registration.pushManager.getSubscription();
                    
                    if (!subscription && !localStorage.getItem('push_declined')) {
                        this.requestPermission();
                    }
                }
            },
            
            async requestPermission() {
                const permission = await Notification.requestPermission();
                
                if (permission === 'granted') {
                    this.subscribeToPush();
                    this.showWelcomeNotification();
                } else {
                    localStorage.setItem('push_declined', 'true');
                }
            },
            
            async subscribeToPush() {
                const registration = await navigator.serviceWorker.ready;
                const subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: this.urlBase64ToUint8Array('YOUR_VAPID_KEY_HERE')
                });
                
                // Send subscription to server
                fetch('/api/push-subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(subscription)
                }).catch(console.error);
            },
            
            showWelcomeNotification() {
                new Notification('Welcome to CostFlowAI!', {
                    body: 'You\'ll receive helpful tips and market updates',
                    icon: '/assets/images/icon-192.png',
                    badge: '/assets/images/badge-72.png'
                });
            },
            
            scheduleRetentionNotifications() {
                // Schedule notifications for different user segments
                const lastVisit = localStorage.getItem('last_visit');
                const daysSinceVisit = lastVisit ? 
                    Math.floor((Date.now() - parseInt(lastVisit)) / (1000 * 60 * 60 * 24)) : 0;
                
                if (daysSinceVisit >= 7) {
                    this.sendRetentionNotification('comeback');
                } else if (daysSinceVisit >= 3) {
                    this.sendRetentionNotification('reminder');
                }
            },
            
            sendRetentionNotification(type) {
                const messages = {
                    reminder: {
                        title: 'New Construction Costs Available',
                        body: 'Material prices have been updated. Check your estimates!'
                    },
                    comeback: {
                        title: 'We miss you at CostFlowAI!',
                        body: 'New calculators and features await. Come back and explore!'
                    }
                };
                
                if (messages[type]) {
                    new Notification(messages[type].title, {
                        body: messages[type].body,
                        icon: '/assets/images/icon-192.png'
                    });
                }
            },
            
            urlBase64ToUint8Array(base64String) {
                const padding = '='.repeat((4 - base64String.length % 4) % 4);
                const base64 = (base64String + padding)
                    .replace(/-/g, '+')
                    .replace(/_/g, '/');
                
                const rawData = window.atob(base64);
                const outputArray = new Uint8Array(rawData.length);
                
                for (let i = 0; i < rawData.length; ++i) {
                    outputArray[i] = rawData.charCodeAt(i);
                }
                return outputArray;
            }
        };
        
        notifications.init();
        window.NotificationSystem = notifications;
    }
    
    // Progress Tracking
    setupProgressTracking() {
        const progressTracker = {
            milestones: [
                { calculations: 1, reward: 'Welcome bonus: 50 points', completed: false },
                { calculations: 5, reward: 'Explorer badge + Premium trial', completed: false },
                { calculations: 25, reward: 'Power User status + API access', completed: false },
                { calculations: 100, reward: 'Expert badge + Free consultation', completed: false }
            ],
            
            checkProgress() {
                const totalCalcs = parseInt(localStorage.getItem('total_calculations') || '0');
                const completedMilestones = JSON.parse(localStorage.getItem('completed_milestones') || '[]');
                
                this.milestones.forEach((milestone, index) => {
                    if (totalCalcs >= milestone.calculations && !completedMilestones.includes(index)) {
                        this.completeMilestone(index, milestone);
                        completedMilestones.push(index);
                        localStorage.setItem('completed_milestones', JSON.stringify(completedMilestones));
                    }
                });
            },
            
            completeMilestone(index, milestone) {
                // Award milestone reward
                if (window.Gamification) {
                    window.Gamification.awardPoints(50, 'milestone completed');
                }
                
                // Show milestone notification
                this.showMilestoneNotification(milestone);
                
                // Track milestone completion
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'milestone_completed', {
                        milestone_id: index,
                        calculations_count: milestone.calculations
                    });
                }
            },
            
            showMilestoneNotification(milestone) {
                const notification = document.createElement('div');
                notification.className = 'milestone-notification';
                notification.innerHTML = `
                    <div class="milestone-content">
                        <h3>🎯 Milestone Achieved!</h3>
                        <p>${milestone.reward}</p>
                        <small>Keep going to unlock more rewards!</small>
                    </div>
                `;
                document.body.appendChild(notification);
                
                setTimeout(() => notification.remove(), 6000);
            },
            
            showProgressBar() {
                const totalCalcs = parseInt(localStorage.getItem('total_calculations') || '0');
                const nextMilestone = this.milestones.find(m => totalCalcs < m.calculations);
                
                if (!nextMilestone) return;
                
                const progress = (totalCalcs / nextMilestone.calculations) * 100;
                const remaining = nextMilestone.calculations - totalCalcs;
                
                const progressHTML = `
                    <div class="progress-tracker" style="position: fixed; bottom: 20px; left: 20px; background: white; padding: 1rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); max-width: 300px; z-index: 1000;">
                        <h4>Next Milestone</h4>
                        <p>${nextMilestone.reward}</p>
                        <div class="progress-bar-container" style="background: #e5e7eb; height: 10px; border-radius: 5px; margin: 0.5rem 0;">
                            <div class="progress-bar-fill" style="width: ${progress}%; height: 100%; background: #0066ff; border-radius: 5px; transition: width 0.3s ease;"></div>
                        </div>
                        <small>${remaining} more calculations to unlock</small>
                        <button onclick="this.parentElement.style.display='none'" style="position: absolute; top: 5px; right: 8px; background: none; border: none;">×</button>
                    </div>
                `;
                
                // Remove existing tracker
                const existing = document.querySelector('.progress-tracker');
                if (existing) existing.remove();
                
                // Add new tracker
                document.body.insertAdjacentHTML('beforeend', progressHTML);
                
                // Auto-hide after 8 seconds
                setTimeout(() => {
                    const tracker = document.querySelector('.progress-tracker');
                    if (tracker) tracker.style.display = 'none';
                }, 8000);
            }
        };
        
        // Check progress on page interactions
        document.addEventListener('click', () => {
            progressTracker.checkProgress();
        });
        
        // Show progress for engaged users
        if (parseInt(localStorage.getItem('total_calculations') || '0') > 0) {
            setTimeout(() => progressTracker.showProgressBar(), 5000);
        }
        
        window.ProgressTracker = progressTracker;
    }
    
    // Community Features
    setupCommunityFeatures() {
        const community = {
            init() {
                this.addCommunityWidget();
                this.trackSocialInteractions();
            },
            
            addCommunityWidget() {
                const widget = document.createElement('div');
                widget.className = 'community-widget';
                widget.innerHTML = `
                    <div class="community-content">
                        <h4>💬 Join the Community</h4>
                        <p>Connect with 10,000+ construction professionals</p>
                        <div class="community-stats">
                            <div class="stat">
                                <strong>15K+</strong>
                                <small>Estimates Shared</small>
                            </div>
                            <div class="stat">
                                <strong>500+</strong>
                                <small>Tips Exchanged</small>
                            </div>
                        </div>
                        <div class="community-actions">
                            <button onclick="joinDiscussion()" class="btn btn-primary">Join Discussion</button>
                            <button onclick="shareEstimate()" class="btn btn-secondary">Share Estimate</button>
                        </div>
                    </div>
                `;
                
                // Add widget to appropriate pages
                if (window.location.pathname.includes('calculator')) {
                    setTimeout(() => {
                        document.body.appendChild(widget);
                        setTimeout(() => widget.style.display = 'none', 10000);
                    }, 30000);
                }
            },
            
            trackSocialInteractions() {
                // Track social button clicks
                document.addEventListener('click', (e) => {
                    if (e.target.matches('[data-social]')) {
                        const platform = e.target.dataset.social;
                        if (typeof gtag !== 'undefined') {
                            gtag('event', 'social_interaction', {
                                platform: platform,
                                action: 'click'
                            });
                        }
                    }
                });
            }
        };
        
        community.init();
        window.Community = community;
        
        // Global functions for community actions
        window.joinDiscussion = function() {
            const w = window.open('https://community.costflowai.com', '_blank', 'noopener,noreferrer');
            if (w) w.opener = null;
        };
        
        window.shareEstimate = function() {
            if (navigator.share) {
                navigator.share({
                    title: 'Check out my construction estimate',
                    url: window.location.href
                });
            } else {
                // Fallback to social sharing
                window.SocialSharing?.shareToSocial('twitter', 0, 'construction');
            }
        };
    }
    
    // Retention Campaigns
    setupRetentionCampaigns() {
        const retention = {
            campaigns: [
                {
                    name: 'weekly_tips',
                    trigger: 'time_based',
                    interval: 7 * 24 * 60 * 60 * 1000, // 7 days
                    message: '💡 Pro Tip: Check material price trends before finalizing estimates'
                },
                {
                    name: 'feature_highlight',
                    trigger: 'usage_based',
                    threshold: 5,
                    message: '🚀 Did you know? You can export estimates to PDF and share with clients'
                },
                {
                    name: 'comeback_offer',
                    trigger: 'absence',
                    days: 14,
                    message: '🎁 Welcome back! Get 30% off Premium for your next project'
                }
            ],
            
            init() {
                this.checkRetentionTriggers();
                this.scheduleReminders();
            },
            
            checkRetentionTriggers() {
                const lastVisit = parseInt(localStorage.getItem('last_visit') || Date.now());
                const daysSinceVisit = (Date.now() - lastVisit) / (1000 * 60 * 60 * 24);
                
                this.campaigns.forEach(campaign => {
                    if (this.shouldTriggerCampaign(campaign, daysSinceVisit)) {
                        this.triggerCampaign(campaign);
                    }
                });
                
                localStorage.setItem('last_visit', Date.now().toString());
            },
            
            shouldTriggerCampaign(campaign, daysSinceVisit) {
                const lastTriggered = parseInt(localStorage.getItem(`campaign_${campaign.name}`) || '0');
                const daysSinceCampaign = (Date.now() - lastTriggered) / (1000 * 60 * 60 * 24);
                
                switch (campaign.trigger) {
                    case 'time_based':
                        return daysSinceCampaign >= 7;
                    case 'usage_based':
                        const usage = parseInt(localStorage.getItem('total_calculations') || '0');
                        return usage >= campaign.threshold && daysSinceCampaign >= 3;
                    case 'absence':
                        return daysSinceVisit >= campaign.days && daysSinceCampaign >= campaign.days;
                    default:
                        return false;
                }
            },
            
            triggerCampaign(campaign) {
                this.showRetentionMessage(campaign.message);
                localStorage.setItem(`campaign_${campaign.name}`, Date.now().toString());
                
                // Track campaign impression
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'retention_campaign', {
                        campaign_name: campaign.name,
                        trigger_type: campaign.trigger
                    });
                }
            },
            
            showRetentionMessage(message) {
                const notification = document.createElement('div');
                notification.className = 'retention-message';
                notification.innerHTML = `
                    <div class="retention-content">
                        <p>${message}</p>
                        <button onclick="this.parentElement.parentElement.remove()">Got it!</button>
                    </div>
                `;
                document.body.appendChild(notification);
                
                setTimeout(() => {
                    if (notification.parentElement) {
                        notification.remove();
                    }
                }, 10000);
            },
            
            scheduleReminders() {
                // Schedule browser notifications for inactive users
                if (parseInt(localStorage.getItem('total_calculations') || '0') > 0) {
                    setTimeout(() => {
                        const lastVisit = parseInt(localStorage.getItem('last_visit') || Date.now());
                        const daysSinceVisit = (Date.now() - lastVisit) / (1000 * 60 * 60 * 24);
                        
                        if (daysSinceVisit >= 3 && window.NotificationSystem) {
                            window.NotificationSystem.scheduleRetentionNotifications();
                        }
                    }, 60000); // Check after 1 minute
                }
            }
        };
        
        retention.init();
        window.Retention = retention;
    }
}

// CSS for engagement notifications
const engagementCSS = `
.points-notification,
.achievement-notification,
.levelup-notification,
.milestone-notification,
.retention-message {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    animation: slideInRight 0.3s ease;
}

.points-content,
.achievement-content,
.levelup-content,
.milestone-content,
.retention-content {
    background: linear-gradient(135deg, #0066ff, #0052cc);
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    display: flex;
    align-items: center;
    gap: 1rem;
}

.achievement-content,
.levelup-content,
.milestone-content {
    background: linear-gradient(135deg, #10b981, #059669);
}

.points-icon {
    font-size: 1.5rem;
}

.achievement-icon {
    font-size: 2rem;
}

.community-widget {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: white;
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    max-width: 300px;
    z-index: 1000;
}

.community-stats {
    display: flex;
    gap: 1rem;
    margin: 1rem 0;
}

.community-stats .stat {
    text-align: center;
    flex: 1;
}

.community-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
}

.community-actions .btn {
    flex: 1;
    padding: 0.5rem;
    font-size: 0.9rem;
}

@keyframes slideInRight {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@media (max-width: 768px) {
    .points-notification,
    .achievement-notification,
    .levelup-notification,
    .milestone-notification,
    .retention-message {
        top: auto;
        bottom: 20px;
        right: 20px;
        left: 20px;
    }
    
    .community-widget {
        bottom: 20px;
        right: 20px;
        left: 20px;
        max-width: none;
    }
}
`;

// Inject CSS
const styleSheet = document.createElement('style');
styleSheet.textContent = engagementCSS;
document.head.appendChild(styleSheet);

// Initialize Engagement Tools
document.addEventListener('DOMContentLoaded', () => {
    window.engagementTools = new EngagementTools();
    console.log('🎯 Engagement tools loaded');
});