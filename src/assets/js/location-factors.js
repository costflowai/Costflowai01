/**
 * CostFlowAI Location Cost Factors
 * Regional cost adjustments based on ZIP code and state
 */

class LocationFactors {
    constructor() {
        // State-level cost factors (relative to national average = 1.0)
        this.stateFactors = {
            'AL': 0.87, 'AK': 1.29, 'AZ': 0.95, 'AR': 0.86, 'CA': 1.23,
            'CO': 1.02, 'CT': 1.08, 'DE': 1.01, 'FL': 0.93, 'GA': 0.89,
            'HI': 1.39, 'ID': 0.94, 'IL': 1.08, 'IN': 0.92, 'IA': 0.91,
            'KS': 0.90, 'KY': 0.88, 'LA': 0.89, 'ME': 0.96, 'MD': 1.04,
            'MA': 1.15, 'MI': 0.97, 'MN': 1.03, 'MS': 0.84, 'MO': 0.94,
            'MT': 0.93, 'NE': 0.91, 'NV': 1.01, 'NH': 1.00, 'NJ': 1.13,
            'NM': 0.91, 'NY': 1.21, 'NC': 0.88, 'ND': 0.93, 'OH': 0.95,
            'OK': 0.87, 'OR': 1.04, 'PA': 1.02, 'RI': 1.06, 'SC': 0.86,
            'SD': 0.89, 'TN': 0.88, 'TX': 0.91, 'UT': 0.96, 'VT': 1.01,
            'VA': 0.96, 'WA': 1.08, 'WV': 0.92, 'WI': 0.99, 'WY': 0.92,
            'DC': 1.11
        };

        // Major metro area adjustments (applied on top of state factor)
        this.metroFactors = {
            // California metros
            '900-908': 1.15, // Los Angeles
            '940-941': 1.25, // San Francisco
            '917-918': 1.10, // San Diego
            '942-944': 1.18, // Sacramento
            '945-948': 1.20, // San Jose
            
            // New York metros
            '100-119': 1.25, // New York City
            '105': 1.30,     // Manhattan
            '112': 1.22,     // Brooklyn
            '104': 1.20,     // Bronx
            
            // Other major metros
            '606-609': 1.12, // Chicago
            '750-752': 1.08, // Dallas
            '770-772': 1.05, // Houston
            '850-853': 1.06, // Phoenix
            '191-192': 1.10, // Philadelphia
            '210-212': 1.09, // DC Metro
            '980-982': 1.10, // Seattle
            '970-972': 1.08, // Portland
            '801-803': 1.07, // Denver
            '330-334': 1.06, // Miami
            '300-303': 1.08, // Atlanta
            '480-481': 1.09, // Detroit
            '440-441': 1.05, // Cleveland
            '554-555': 1.07, // Minneapolis
            '631-633': 1.04, // St. Louis
            '640-641': 1.03, // Kansas City
            '532-534': 1.05, // Milwaukee
            '700-701': 1.02, // New Orleans
            '891-893': 1.06, // Las Vegas
            '840-841': 0.98, // Salt Lake City
            '370-372': 1.03, // Nashville
            '327-329': 1.04, // Orlando
            '335-338': 1.05, // Tampa
            '232-233': 1.08, // Richmond
            '150-152': 1.05, // Pittsburgh
            '450-452': 1.04, // Cincinnati
            '430-432': 1.03, // Columbus
            '462-464': 1.02, // Indianapolis
            '282-283': 1.01, // Charlotte
            '200-201': 1.06  // Boston proper
        };

        // Material cost variations by region
        this.materialFactors = {
            lumber: {
                'Northwest': 0.92,
                'Southeast': 0.98,
                'Northeast': 1.05,
                'Southwest': 1.02,
                'Midwest': 1.00
            },
            concrete: {
                'Northwest': 1.03,
                'Southeast': 0.96,
                'Northeast': 1.08,
                'Southwest': 0.98,
                'Midwest': 0.99
            },
            steel: {
                'Northwest': 1.05,
                'Southeast': 1.00,
                'Northeast': 1.04,
                'Southwest': 1.02,
                'Midwest': 0.97
            }
        };

        // Labor cost index by state
        this.laborFactors = {
            'AL': 0.82, 'AK': 1.45, 'AZ': 0.92, 'AR': 0.80, 'CA': 1.38,
            'CO': 1.05, 'CT': 1.15, 'DE': 1.08, 'FL': 0.88, 'GA': 0.85,
            'HI': 1.52, 'ID': 0.90, 'IL': 1.18, 'IN': 0.95, 'IA': 0.93,
            'KS': 0.88, 'KY': 0.85, 'LA': 0.86, 'ME': 0.94, 'MD': 1.10,
            'MA': 1.28, 'MI': 1.02, 'MN': 1.08, 'MS': 0.78, 'MO': 0.98,
            'MT': 0.95, 'NE': 0.90, 'NV': 1.08, 'NH': 1.02, 'NJ': 1.25,
            'NM': 0.88, 'NY': 1.35, 'NC': 0.82, 'ND': 0.95, 'OH': 1.00,
            'OK': 0.83, 'OR': 1.12, 'PA': 1.08, 'RI': 1.12, 'SC': 0.80,
            'SD': 0.85, 'TN': 0.83, 'TX': 0.88, 'UT': 0.92, 'VT': 1.00,
            'VA': 0.93, 'WA': 1.18, 'WV': 0.95, 'WI': 1.05, 'WY': 0.93,
            'DC': 1.18
        };
    }

    /**
     * Get cost factor for a ZIP code
     */
    getFactorByZip(zipCode) {
        const zip = String(zipCode).substring(0, 3);
        const state = this.getStateFromZip(zip);
        
        if (!state) {
            return { factor: 1.0, state: 'US', metro: null };
        }

        let factor = this.stateFactors[state] || 1.0;
        
        // Check for metro adjustment
        for (const [zipRange, metroFactor] of Object.entries(this.metroFactors)) {
            if (this.isZipInRange(zip, zipRange)) {
                factor *= metroFactor;
                return { 
                    factor: Number(factor.toFixed(3)), 
                    state, 
                    metro: this.getMetroName(zipRange) 
                };
            }
        }

        return { factor: Number(factor.toFixed(3)), state, metro: null };
    }

    /**
     * Get cost factor by state
     */
    getFactorByState(state) {
        const stateCode = state.toUpperCase();
        return {
            overall: this.stateFactors[stateCode] || 1.0,
            labor: this.laborFactors[stateCode] || 1.0,
            state: stateCode
        };
    }

    /**
     * Get detailed cost breakdown with location adjustments
     */
    getDetailedFactors(zipCode, projectType = 'residential') {
        const zip = String(zipCode).substring(0, 3);
        const state = this.getStateFromZip(zip);
        const region = this.getRegionFromState(state);
        
        const baseFactor = this.getFactorByZip(zipCode);
        
        return {
            overall: baseFactor.factor,
            state: state,
            metro: baseFactor.metro,
            region: region,
            breakdown: {
                labor: this.laborFactors[state] || 1.0,
                materials: this.getRegionalMaterialFactor(region, projectType),
                equipment: this.stateFactors[state] || 1.0,
                overhead: 1.0 + ((this.stateFactors[state] - 1.0) * 0.5)
            },
            description: this.getFactorDescription(baseFactor.factor)
        };
    }

    /**
     * Check if ZIP is in range
     */
    isZipInRange(zip, range) {
        const parts = range.split('-');
        if (parts.length === 1) {
            return zip === parts[0];
        }
        const [start, end] = parts.map(Number);
        const zipNum = Number(zip);
        return zipNum >= start && zipNum <= end;
    }

    /**
     * Get state from ZIP code prefix
     */
    getStateFromZip(zip) {
        const zipNum = Number(zip);
        
        // ZIP to state mapping (simplified - first 3 digits)
        if (zipNum >= 10 && zipNum <= 27) return 'MA';
        if (zipNum >= 28 && zipNum <= 29) return 'RI';
        if (zipNum >= 30 && zipNum <= 38) return 'NH';
        if (zipNum >= 39 && zipNum <= 49) return 'ME';
        if (zipNum >= 50 && zipNum <= 59) return 'VT';
        if (zipNum >= 60 && zipNum <= 69) return 'CT';
        if (zipNum >= 70 && zipNum <= 89) return 'NJ';
        if (zipNum >= 100 && zipNum <= 149) return 'NY';
        if (zipNum >= 150 && zipNum <= 196) return 'PA';
        if (zipNum >= 197 && zipNum <= 199) return 'DE';
        if (zipNum >= 200 && zipNum <= 212) return 'DC';
        if (zipNum >= 206 && zipNum <= 219) return 'MD';
        if (zipNum >= 220 && zipNum <= 246) return 'VA';
        if (zipNum >= 247 && zipNum <= 269) return 'WV';
        if (zipNum >= 270 && zipNum <= 289) return 'NC';
        if (zipNum >= 290 && zipNum <= 299) return 'SC';
        if (zipNum >= 300 && zipNum <= 319) return 'GA';
        if (zipNum >= 320 && zipNum <= 349) return 'FL';
        if (zipNum >= 350 && zipNum <= 369) return 'AL';
        if (zipNum >= 370 && zipNum <= 385) return 'TN';
        if (zipNum >= 386 && zipNum <= 399) return 'MS';
        if (zipNum >= 400 && zipNum <= 427) return 'KY';
        if (zipNum >= 430 && zipNum <= 459) return 'OH';
        if (zipNum >= 460 && zipNum <= 479) return 'IN';
        if (zipNum >= 480 && zipNum <= 499) return 'MI';
        if (zipNum >= 500 && zipNum <= 528) return 'IA';
        if (zipNum >= 530 && zipNum <= 549) return 'WI';
        if (zipNum >= 550 && zipNum <= 567) return 'MN';
        if (zipNum >= 570 && zipNum <= 577) return 'SD';
        if (zipNum >= 580 && zipNum <= 588) return 'ND';
        if (zipNum >= 590 && zipNum <= 599) return 'MT';
        if (zipNum >= 600 && zipNum <= 629) return 'IL';
        if (zipNum >= 630 && zipNum <= 658) return 'MO';
        if (zipNum >= 660 && zipNum <= 679) return 'KS';
        if (zipNum >= 680 && zipNum <= 693) return 'NE';
        if (zipNum >= 700 && zipNum <= 714) return 'LA';
        if (zipNum >= 716 && zipNum <= 729) return 'AR';
        if (zipNum >= 730 && zipNum <= 749) return 'OK';
        if (zipNum >= 750 && zipNum <= 799) return 'TX';
        if (zipNum >= 800 && zipNum <= 816) return 'CO';
        if (zipNum >= 820 && zipNum <= 831) return 'WY';
        if (zipNum >= 832 && zipNum <= 838) return 'ID';
        if (zipNum >= 840 && zipNum <= 847) return 'UT';
        if (zipNum >= 850 && zipNum <= 865) return 'AZ';
        if (zipNum >= 870 && zipNum <= 884) return 'NM';
        if (zipNum >= 889 && zipNum <= 899) return 'NV';
        if (zipNum >= 900 && zipNum <= 961) return 'CA';
        if (zipNum >= 967 && zipNum <= 968) return 'HI';
        if (zipNum >= 970 && zipNum <= 979) return 'OR';
        if (zipNum >= 980 && zipNum <= 994) return 'WA';
        if (zipNum >= 995 && zipNum <= 999) return 'AK';
        
        return null;
    }

    /**
     * Get region from state
     */
    getRegionFromState(state) {
        const regions = {
            'Northeast': ['ME', 'NH', 'VT', 'MA', 'RI', 'CT', 'NY', 'NJ', 'PA'],
            'Southeast': ['DE', 'MD', 'DC', 'VA', 'WV', 'NC', 'SC', 'GA', 'FL', 'KY', 'TN', 'AL', 'MS', 'AR', 'LA'],
            'Midwest': ['OH', 'IN', 'IL', 'MI', 'WI', 'MN', 'IA', 'MO', 'ND', 'SD', 'NE', 'KS'],
            'Southwest': ['OK', 'TX', 'NM', 'AZ'],
            'Northwest': ['MT', 'ID', 'WY', 'CO', 'UT', 'NV', 'CA', 'OR', 'WA', 'AK', 'HI']
        };
        
        for (const [region, states] of Object.entries(regions)) {
            if (states.includes(state)) {
                return region;
            }
        }
        return 'National';
    }

    /**
     * Get regional material factor
     */
    getRegionalMaterialFactor(region, projectType) {
        const materialMix = {
            'residential': { lumber: 0.4, concrete: 0.3, steel: 0.3 },
            'commercial': { lumber: 0.2, concrete: 0.4, steel: 0.4 },
            'industrial': { lumber: 0.1, concrete: 0.4, steel: 0.5 }
        };
        
        const mix = materialMix[projectType] || materialMix['residential'];
        let factor = 0;
        
        for (const [material, weight] of Object.entries(mix)) {
            const regionalFactor = this.materialFactors[material][region] || 1.0;
            factor += regionalFactor * weight;
        }
        
        return Number(factor.toFixed(3));
    }

    /**
     * Get metro area name
     */
    getMetroName(zipRange) {
        const metroNames = {
            '900-908': 'Los Angeles',
            '940-941': 'San Francisco',
            '917-918': 'San Diego',
            '100-119': 'New York City',
            '606-609': 'Chicago',
            '750-752': 'Dallas',
            '770-772': 'Houston',
            '850-853': 'Phoenix',
            '191-192': 'Philadelphia',
            '210-212': 'Washington DC',
            '980-982': 'Seattle',
            '330-334': 'Miami',
            '300-303': 'Atlanta'
        };
        return metroNames[zipRange] || 'Metro Area';
    }

    /**
     * Get description of cost factor
     */
    getFactorDescription(factor) {
        if (factor < 0.9) return 'Significantly below national average';
        if (factor < 0.95) return 'Below national average';
        if (factor < 1.05) return 'Near national average';
        if (factor < 1.1) return 'Above national average';
        if (factor < 1.2) return 'Significantly above national average';
        return 'Well above national average';
    }

    /**
     * Apply location factor to estimate
     */
    applyLocationFactor(baseEstimate, zipCode) {
        const factors = this.getDetailedFactors(zipCode);
        return {
            adjusted: Math.round(baseEstimate * factors.overall),
            base: baseEstimate,
            factor: factors.overall,
            location: factors.state,
            metro: factors.metro,
            description: factors.description
        };
    }
}

// Create global instance
window.locationFactors = new LocationFactors();