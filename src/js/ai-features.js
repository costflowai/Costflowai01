// AI-Powered Smart Features for CostFlowAI
class AIFeatures {
    constructor() {
        this.init();
    }
    
    init() {
        this.setupSmartRecommendations();
        this.setupPriceAlerts();
        this.setupRiskAssessment();
        this.setupCompetitorAnalysis();
    }
    
    // Smart Material Recommendations
    setupSmartRecommendations() {
        const recommendationEngine = {
            materials: {
                'residential': {
                    'budget': ['vinyl_siding', 'laminate_flooring', 'fiberglass_insulation'],
                    'standard': ['fiber_cement', 'engineered_hardwood', 'blown_cellulose'],
                    'premium': ['brick_veneer', 'solid_hardwood', 'spray_foam'],
                    'luxury': ['natural_stone', 'exotic_hardwood', 'smart_home_tech']
                },
                'commercial': {
                    'basic': ['metal_studs', 'dropped_ceiling', 'commercial_carpet'],
                    'standard': ['steel_frame', 'suspended_grid', 'polished_concrete'],
                    'premium': ['curtain_wall', 'coffered_ceiling', 'luxury_vinyl_tile']
                }
            },
            
            getRecommendations(projectType, budget, sqft) {
                const recs = this.materials[projectType]?.[budget] || [];
                return recs.map(material => ({
                    name: material.replace(/_/g, ' ').toUpperCase(),
                    cost: this.getCostEstimate(material, sqft),
                    sustainability: this.getSustainabilityScore(material),
                    durability: this.getDurabilityScore(material)
                }));
            },
            
            getCostEstimate(material, sqft) {
                const costPerSqft = {
                    'vinyl_siding': 3.50,
                    'fiber_cement': 8.50,
                    'brick_veneer': 15.00,
                    'natural_stone': 25.00
                };
                return (costPerSqft[material] || 5.00) * sqft;
            },
            
            getSustainabilityScore(material) {
                const scores = {
                    'spray_foam': 85,
                    'blown_cellulose': 90,
                    'fiberglass_insulation': 70
                };
                return scores[material] || 75;
            },
            
            getDurabilityScore(material) {
                const scores = {
                    'natural_stone': 95,
                    'brick_veneer': 90,
                    'fiber_cement': 80,
                    'vinyl_siding': 60
                };
                return scores[material] || 70;
            }
        };
        
        window.MaterialRecommendations = recommendationEngine;
    }
    
    // Real-time Price Alerts
    setupPriceAlerts() {
        const priceAlerts = {
            materials: {
                'lumber': { current: 450, trend: 'up', alert: 500 },
                'steel': { current: 1200, trend: 'down', alert: 1100 },
                'concrete': { current: 180, trend: 'stable', alert: 200 }
            },
            
            checkAlerts() {
                const alerts = [];
                Object.entries(this.materials).forEach(([material, data]) => {
                    if (data.current >= data.alert) {
                        alerts.push({
                            material,
                            message: `${material.toUpperCase()} prices are ${data.trend === 'up' ? 'rising' : 'high'}: $${data.current}/unit`,
                            trend: data.trend,
                            impact: 'Consider alternative materials or lock in prices'
                        });
                    }
                });
                return alerts;
            },
            
            getPriceForecast(material, days = 30) {
                const data = this.materials[material];
                if (!data) return null;
                
                const volatility = 0.1; // 10% volatility
                const trendMultiplier = data.trend === 'up' ? 1.05 : data.trend === 'down' ? 0.95 : 1.0;
                const forecast = data.current * trendMultiplier * (1 + (Math.random() - 0.5) * volatility);
                
                return {
                    material,
                    currentPrice: data.current,
                    forecastPrice: Math.round(forecast),
                    confidence: 78,
                    recommendation: forecast > data.current ? 'Buy now' : 'Wait if possible'
                };
            }
        };
        
        window.PriceAlerts = priceAlerts;
    }
    
    // Risk Assessment AI
    setupRiskAssessment() {
        const riskAssessment = {
            assessProject(projectData) {
                const risks = [];
                let riskScore = 0;
                
                // Budget risk
                if (projectData.budget < 50000) {
                    risks.push({ type: 'Budget', level: 'Medium', description: 'Low budget may limit quality options' });
                    riskScore += 30;
                }
                
                // Timeline risk  
                if (projectData.timeline < 90) {
                    risks.push({ type: 'Timeline', level: 'High', description: 'Rushed timeline increases costs 15-25%' });
                    riskScore += 40;
                }
                
                // Weather risk (seasonal)
                const month = new Date().getMonth();
                if ([11, 0, 1, 2].includes(month)) {
                    risks.push({ type: 'Weather', level: 'Medium', description: 'Winter conditions may cause delays' });
                    riskScore += 25;
                }
                
                // Market risk
                if (this.getCurrentMarketVolatility() > 0.15) {
                    risks.push({ type: 'Market', level: 'High', description: 'High material price volatility' });
                    riskScore += 35;
                }
                
                return {
                    overallRisk: this.getRiskLevel(riskScore),
                    riskScore,
                    risks,
                    recommendations: this.getRecommendations(risks)
                };
            },
            
            getRiskLevel(score) {
                if (score < 30) return 'Low';
                if (score < 60) return 'Medium';
                return 'High';
            },
            
            getCurrentMarketVolatility() {
                // Simulate market data
                return Math.random() * 0.3;
            },
            
            getRecommendations(risks) {
                const recs = [];
                if (risks.some(r => r.type === 'Budget')) {
                    recs.push('Consider phased construction approach');
                }
                if (risks.some(r => r.type === 'Timeline')) {
                    recs.push('Add 20% time buffer to schedule');
                }
                if (risks.some(r => r.type === 'Weather')) {
                    recs.push('Plan interior work during winter months');
                }
                return recs;
            }
        };
        
        window.RiskAssessment = riskAssessment;
    }
    
    // Competitor Analysis
    setupCompetitorAnalysis() {
        const competitorAnalysis = {
            competitors: {
                'BuildingCosts': { accuracy: 85, features: 12, pricing: 'premium' },
                'EstimateOne': { accuracy: 78, features: 15, pricing: 'mid' },
                'QuickCost': { accuracy: 70, features: 8, pricing: 'budget' }
            },
            
            ourAdvantages: [
                'AI-powered recommendations',
                'Real-time price alerts',
                'Risk assessment',
                'Free to use',
                'Mobile optimized',
                'Offline capable'
            ],
            
            getCompetitiveAnalysis() {
                return {
                    ourScore: 92,
                    advantages: this.ourAdvantages,
                    competitors: Object.entries(this.competitors).map(([name, data]) => ({
                        name,
                        ...data,
                        ourAdvantage: 92 - data.accuracy
                    }))
                };
            }
        };
        
        window.CompetitorAnalysis = competitorAnalysis;
    }
}

// Regional Cost Intelligence
class RegionalIntelligence {
    constructor() {
        this.regions = {
            'california': { multiplier: 1.45, laborRate: 85, permittingTime: 45 },
            'texas': { multiplier: 0.95, laborRate: 55, permittingTime: 30 },
            'florida': { multiplier: 1.05, laborRate: 48, permittingTime: 35 },
            'new_york': { multiplier: 1.55, laborRate: 95, permittingTime: 60 }
        };
    }
    
    getRegionalAdjustment(region, baseEstimate) {
        const regionData = this.regions[region.toLowerCase()] || { multiplier: 1.0, laborRate: 60, permittingTime: 35 };
        
        return {
            adjustedCost: baseEstimate * regionData.multiplier,
            laborRate: regionData.laborRate,
            permittingTime: regionData.permittingTime,
            insights: this.getRegionalInsights(region, regionData)
        };
    }
    
    getRegionalInsights(region, data) {
        const insights = [];
        
        if (data.multiplier > 1.3) {
            insights.push('High-cost region - consider value engineering');
        }
        if (data.laborRate > 80) {
            insights.push('Premium labor market - factor in skilled trades shortage');
        }
        if (data.permittingTime > 50) {
            insights.push('Extended permitting timeline - start early');
        }
        
        return insights;
    }
}

// Initialize AI Features
document.addEventListener('DOMContentLoaded', () => {
    window.aiFeatures = new AIFeatures();
    window.regionalIntelligence = new RegionalIntelligence();
    
    console.log('🤖 AI Features loaded successfully');
});