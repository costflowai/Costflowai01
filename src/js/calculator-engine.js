/**
 * CostFlowAI Calculator Engine
 * Single, reliable calculation system for all construction calculators
 * Mobile-optimized, tested, and production-ready
 */

class CalculatorEngine {
    constructor() {
        this.calculators = new Map();
        this.results = new Map();
        this.listeners = new Map();
        this.init();
    }

    init() {
        console.log('🏗️ CostFlowAI Calculator Engine v2.0 initialized');
        this.registerAllCalculators();
        this.setupEventListeners();
    }

    // Register all calculator types
    registerAllCalculators() {
        // Concrete Calculator
        this.register('concrete', {
            name: 'Concrete Calculator',
            icon: '🏗️',
            description: 'Calculate concrete volume, cost, and rebar requirements',
            inputs: {
                length: { type: 'number', label: 'Length (ft)', min: 0, step: 0.1, required: true },
                width: { type: 'number', label: 'Width (ft)', min: 0, step: 0.1, required: true },
                thickness: { type: 'number', label: 'Thickness (in)', min: 1, step: 0.25, required: true },
                psi: { 
                    type: 'select', 
                    label: 'PSI Strength', 
                    options: [
                        { value: 2500, label: '2500 PSI ($125/yd³)' },
                        { value: 3000, label: '3000 PSI ($130/yd³)' },
                        { value: 3500, label: '3500 PSI ($135/yd³)' },
                        { value: 4000, label: '4000 PSI ($140/yd³)' },
                        { value: 4500, label: '4500 PSI ($145/yd³)' }
                    ],
                    default: 3500
                },
                pourType: {
                    type: 'select',
                    label: 'Pour Type',
                    options: [
                        { value: 'slab', label: 'Slab (5% waste)' },
                        { value: 'footing', label: 'Footing (8% waste)' },
                        { value: 'wall', label: 'Wall (10% waste)' },
                        { value: 'stairs', label: 'Stairs (15% waste)' }
                    ],
                    default: 'slab'
                },
                rebar: { type: 'checkbox', label: 'Include Rebar Reinforcement' },
                rebarType: {
                    type: 'select',
                    label: 'Rebar Type',
                    options: [
                        { value: 'light', label: 'Light (#3 @ 18") - $0.65/sq ft' },
                        { value: 'standard', label: 'Standard (#4 @ 12") - $0.85/sq ft' },
                        { value: 'heavy', label: 'Heavy (#5 @ 12") - $1.25/sq ft' }
                    ],
                    default: 'standard',
                    dependent: 'rebar'
                }
            },
            calculate: this.calculateConcrete.bind(this)
        });

        // Framing Calculator
        this.register('framing', {
            name: 'Framing Calculator',
            icon: '🔨',
            description: 'Estimate lumber and hardware costs for framing projects',
            inputs: {
                area: { type: 'number', label: 'Area (sq ft)', min: 0, step: 1, required: true },
                framingType: {
                    type: 'select',
                    label: 'Framing Type',
                    options: [
                        { value: 'floor', label: 'Floor Joists (2.4 LF/sq ft)' },
                        { value: 'wall', label: 'Wall Studs (1.8 LF/sq ft)' },
                        { value: 'ceiling', label: 'Ceiling Joists (2.2 LF/sq ft)' },
                        { value: 'roof', label: 'Roof Rafters (2.8 LF/sq ft)' }
                    ],
                    default: 'wall'
                },
                lumberSize: {
                    type: 'select',
                    label: 'Lumber Size',
                    options: [
                        { value: '2x4', label: '2x4 (0.67 BF/LF)' },
                        { value: '2x6', label: '2x6 (1.0 BF/LF)' },
                        { value: '2x8', label: '2x8 (1.33 BF/LF)' },
                        { value: '2x10', label: '2x10 (1.67 BF/LF)' },
                        { value: '2x12', label: '2x12 (2.0 BF/LF)' }
                    ],
                    default: '2x4'
                },
                lumberGrade: {
                    type: 'select',
                    label: 'Lumber Grade',
                    options: [
                        { value: 'spf', label: 'SPF - $0.65/BF' },
                        { value: 'hem-fir', label: 'Hem-Fir - $0.70/BF' },
                        { value: 'southern-pine', label: 'Southern Pine - $0.75/BF' },
                        { value: 'douglas-fir', label: 'Douglas Fir - $0.85/BF' }
                    ],
                    default: 'spf'
                },
                spacing: {
                    type: 'select',
                    label: 'Spacing',
                    options: [
                        { value: 12, label: '12" OC (133% material)' },
                        { value: 16, label: '16" OC (100% material)' },
                        { value: 24, label: '24" OC (67% material)' }
                    ],
                    default: 16
                }
            },
            calculate: this.calculateFraming.bind(this)
        });

        // Roofing Calculator
        this.register('roofing', {
            name: 'Roofing Calculator',
            icon: '🏠',
            description: 'Calculate roofing materials and installation costs',
            inputs: {
                length: { type: 'number', label: 'Length (ft)', min: 0, step: 0.1, required: true },
                width: { type: 'number', label: 'Width (ft)', min: 0, step: 0.1, required: true },
                pitch: {
                    type: 'select',
                    label: 'Roof Pitch',
                    options: [
                        { value: '3/12', label: '3/12 (1.031 factor)' },
                        { value: '4/12', label: '4/12 (1.054 factor)' },
                        { value: '5/12', label: '5/12 (1.083 factor)' },
                        { value: '6/12', label: '6/12 (1.118 factor)' },
                        { value: '7/12', label: '7/12 (1.158 factor)' },
                        { value: '8/12', label: '8/12 (1.202 factor)' },
                        { value: '9/12', label: '9/12 (1.250 factor)' },
                        { value: '10/12', label: '10/12 (1.302 factor)' },
                        { value: '12/12', label: '12/12 (1.414 factor)' }
                    ],
                    default: '6/12'
                },
                material: {
                    type: 'select',
                    label: 'Roofing Material',
                    options: [
                        { value: 'asphalt-shingles', label: 'Asphalt Shingles - $85/sq' },
                        { value: 'architectural-shingles', label: 'Architectural Shingles - $125/sq' },
                        { value: 'metal-panels', label: 'Metal Panels - $200/sq' },
                        { value: 'metal-shingles', label: 'Metal Shingles - $280/sq' },
                        { value: 'tile-clay', label: 'Clay Tile - $350/sq' },
                        { value: 'tile-concrete', label: 'Concrete Tile - $180/sq' }
                    ],
                    default: 'asphalt-shingles'
                },
                complexity: {
                    type: 'select',
                    label: 'Roof Complexity',
                    options: [
                        { value: 'simple', label: 'Simple (1.0x factor)' },
                        { value: 'moderate', label: 'Moderate (1.15x factor)' },
                        { value: 'complex', label: 'Complex (1.35x factor)' }
                    ],
                    default: 'simple'
                },
                tearOff: { type: 'checkbox', label: 'Include Tear-off ($45/sq)' }
            },
            calculate: this.calculateRoofing.bind(this)
        });

        // Paint Calculator
        this.register('paint', {
            name: 'Paint Calculator',
            icon: '🎨',
            description: 'Calculate paint quantity and cost for interior/exterior projects',
            inputs: {
                wallArea: { type: 'number', label: 'Wall Area (sq ft)', min: 0, step: 1, required: true },
                openings: { type: 'number', label: 'Doors/Windows (sq ft)', min: 0, step: 1, default: 0 },
                coats: {
                    type: 'select',
                    label: 'Number of Coats',
                    options: [
                        { value: 1, label: '1 Coat' },
                        { value: 2, label: '2 Coats (Recommended)' },
                        { value: 3, label: '3 Coats' }
                    ],
                    default: 2
                },
                texture: {
                    type: 'select',
                    label: 'Surface Texture',
                    options: [
                        { value: 'smooth', label: 'Smooth (400 sq ft/gal)' },
                        { value: 'light', label: 'Light Texture (350 sq ft/gal)' },
                        { value: 'medium', label: 'Medium Texture (300 sq ft/gal)' },
                        { value: 'heavy', label: 'Heavy Texture (250 sq ft/gal)' },
                        { value: 'stucco', label: 'Stucco/Rough (200 sq ft/gal)' }
                    ],
                    default: 'smooth'
                },
                quality: {
                    type: 'select',
                    label: 'Paint Quality',
                    options: [
                        { value: 'economy', label: 'Economy - $35/gal' },
                        { value: 'standard', label: 'Standard - $55/gal' },
                        { value: 'premium', label: 'Premium - $75/gal' },
                        { value: 'luxury', label: 'Luxury - $95/gal' }
                    ],
                    default: 'standard'
                },
                needsPrimer: { type: 'checkbox', label: 'Include Primer' }
            },
            calculate: this.calculatePaint.bind(this)
        });

        // Electrical Calculator
        this.register('electrical', {
            name: 'Electrical Calculator',
            icon: '⚡',
            description: 'Estimate electrical wiring and installation costs',
            inputs: {
                area: { type: 'number', label: 'Area (sq ft)', min: 0, step: 1, required: true },
                outlets: { type: 'number', label: 'Number of Outlets', min: 0, step: 1, required: true },
                switches: { type: 'number', label: 'Number of Switches', min: 0, step: 1, required: true },
                fixtures: { type: 'number', label: 'Light Fixtures', min: 0, step: 1, required: true },
                serviceSize: {
                    type: 'select',
                    label: 'Panel Service Size',
                    options: [
                        { value: 100, label: '100 Amp Panel' },
                        { value: 200, label: '200 Amp Panel' },
                        { value: 400, label: '400 Amp Panel' }
                    ],
                    default: 200
                },
                wireType: {
                    type: 'select',
                    label: 'Wire Type',
                    options: [
                        { value: 'copper', label: 'Copper Wire' },
                        { value: 'aluminum', label: 'Aluminum Wire' }
                    ],
                    default: 'copper'
                }
            },
            calculate: this.calculateElectrical.bind(this)
        });

        // HVAC Calculator
        this.register('hvac', {
            name: 'HVAC Calculator',
            icon: '❄️',
            description: 'Calculate heating and cooling system costs',
            inputs: {
                area: { type: 'number', label: 'Area (sq ft)', min: 0, step: 1, required: true },
                ceilingHeight: { type: 'number', label: 'Ceiling Height (ft)', min: 7, max: 20, step: 0.5, default: 8 },
                insulation: {
                    type: 'select',
                    label: 'Insulation Level',
                    options: [
                        { value: 'poor', label: 'Poor (40+ BTU/sq ft)' },
                        { value: 'average', label: 'Average (30 BTU/sq ft)' },
                        { value: 'good', label: 'Good (20 BTU/sq ft)' },
                        { value: 'excellent', label: 'Excellent (15 BTU/sq ft)' }
                    ],
                    default: 'average'
                },
                systemType: {
                    type: 'select',
                    label: 'System Type',
                    options: [
                        { value: 'central-air', label: 'Central Air & Heat' },
                        { value: 'heat-pump', label: 'Heat Pump System' },
                        { value: 'mini-split', label: 'Mini-Split System' },
                        { value: 'window-units', label: 'Window Units' }
                    ],
                    default: 'central-air'
                },
                ductwork: { type: 'checkbox', label: 'Include New Ductwork' }
            },
            calculate: this.calculateHVAC.bind(this)
        });

        console.log(`✅ Registered ${this.calculators.size} calculators`);
    }

    // Register a calculator
    register(id, config) {
        if (!id || !config || typeof config.calculate !== 'function') {
            throw new Error('Invalid calculator configuration');
        }
        this.calculators.set(id, config);
    }

    // Get calculator configuration
    getCalculator(id) {
        return this.calculators.get(id);
    }

    // Get all calculators
    getAllCalculators() {
        return Array.from(this.calculators.entries()).map(([id, config]) => ({
            id,
            ...config
        }));
    }

    // Calculate results for a specific calculator
    calculate(calculatorId, inputs) {
        const calculator = this.calculators.get(calculatorId);
        if (!calculator) {
            throw new Error(`Calculator '${calculatorId}' not found`);
        }

        try {
            // Validate inputs
            const validatedInputs = this.validateInputs(calculator.inputs, inputs);
            
            // Perform calculation
            const results = calculator.calculate(validatedInputs);
            
            // Store results
            this.results.set(calculatorId, {
                inputs: validatedInputs,
                results,
                timestamp: new Date().toISOString(),
                calculatorName: calculator.name
            });

            // Notify listeners
            this.notifyListeners(calculatorId, 'calculated', { inputs: validatedInputs, results });

            return results;
        } catch (error) {
            console.error(`Calculation error for ${calculatorId}:`, error);
            this.notifyListeners(calculatorId, 'error', { error: error.message });
            throw error;
        }
    }

    // Validate inputs against calculator schema
    validateInputs(schema, inputs) {
        const validated = {};
        
        for (const [key, config] of Object.entries(schema)) {
            const value = inputs[key];
            
            // Handle required fields
            if (config.required && (value === undefined || value === null || value === '')) {
                throw new Error(`${config.label} is required`);
            }
            
            // Handle dependent fields
            if (config.dependent && !inputs[config.dependent]) {
                continue; // Skip if dependency not met
            }
            
            // Set default if no value provided
            if (value === undefined || value === null || value === '') {
                validated[key] = config.default || (config.type === 'number' ? 0 : config.type === 'checkbox' ? false : '');
                continue;
            }
            
            // Validate by type
            switch (config.type) {
                case 'number':
                    const num = parseFloat(value);
                    if (isNaN(num)) {
                        throw new Error(`${config.label} must be a valid number`);
                    }
                    if (config.min !== undefined && num < config.min) {
                        throw new Error(`${config.label} must be at least ${config.min}`);
                    }
                    if (config.max !== undefined && num > config.max) {
                        throw new Error(`${config.label} must be at most ${config.max}`);
                    }
                    validated[key] = num;
                    break;
                    
                case 'select':
                    if (config.options && !config.options.find(opt => opt.value == value)) {
                        throw new Error(`Invalid option for ${config.label}`);
                    }
                    validated[key] = value;
                    break;
                    
                case 'checkbox':
                    validated[key] = Boolean(value);
                    break;
                    
                default:
                    validated[key] = String(value);
            }
        }
        
        return validated;
    }

    // Calculator implementations
    calculateConcrete(inputs) {
        const { length, width, thickness, psi, pourType, rebar, rebarType } = inputs;
        
        // Basic calculations
        const thicknessFt = thickness / 12;
        const volumeCuFt = length * width * thicknessFt;
        const volumeCuYd = volumeCuFt / 27;
        const area = length * width;
        
        // Waste factors
        const wasteFactors = { slab: 1.05, footing: 1.08, wall: 1.10, stairs: 1.15 };
        const wasteFactor = wasteFactors[pourType] || 1.05;
        const adjustedVolume = volumeCuYd * wasteFactor;
        
        // Pricing
        const psiPricing = { 2500: 125, 3000: 130, 3500: 135, 4000: 140, 4500: 145 };
        const mixPrice = psiPricing[psi] || 135;
        const materialCost = adjustedVolume * mixPrice;
        
        // Rebar costs
        const rebarCosts = { light: 0.65, standard: 0.85, heavy: 1.25 };
        const rebarCost = rebar ? area * (rebarCosts[rebarType] || 0.85) : 0;
        
        // Labor costs
        const laborRate = 45; // per cubic yard
        const laborCost = adjustedVolume * laborRate;
        
        // Delivery
        const deliveryCost = 150; // standard delivery
        
        const totalCost = materialCost + rebarCost + laborCost + deliveryCost;
        
        return {
            area: Math.round(area),
            volume: Math.round(volumeCuFt * 100) / 100,
            yards: Math.round(adjustedVolume * 100) / 100,
            materialCost: Math.round(materialCost),
            rebarCost: Math.round(rebarCost),
            laborCost: Math.round(laborCost),
            deliveryCost: deliveryCost,
            totalCost: Math.round(totalCost),
            breakdown: {
                wasteFactor: `${Math.round((wasteFactor - 1) * 100)}%`,
                pricePerYard: `$${mixPrice}`,
                laborPerYard: `$${laborRate}`
            }
        };
    }

    calculateFraming(inputs) {
        const { area, framingType, lumberSize, lumberGrade, spacing } = inputs;
        
        // Framing factors (linear feet per square foot)
        const framingFactors = { floor: 2.4, wall: 1.8, ceiling: 2.2, roof: 2.8 };
        const framingFactor = framingFactors[framingType] || 1.8;
        
        // Spacing factor
        const spacingFactor = 16 / spacing; // 16" OC is baseline
        
        // Calculate lumber requirements
        const linearFeet = area * framingFactor * spacingFactor;
        
        // Board feet calculation
        const boardFeetPerLF = { '2x4': 0.67, '2x6': 1.0, '2x8': 1.33, '2x10': 1.67, '2x12': 2.0 };
        const boardFeet = linearFeet * (boardFeetPerLF[lumberSize] || 0.67);
        
        // Pricing
        const lumberPricing = { spf: 0.65, 'hem-fir': 0.70, 'southern-pine': 0.75, 'douglas-fir': 0.85 };
        const pricePerBF = lumberPricing[lumberGrade] || 0.65;
        
        // Costs
        const materialCost = boardFeet * pricePerBF * 1.10; // 10% waste
        const hardwareCost = area * 0.35; // Nails, screws, plates
        const laborCost = area * 2.25; // Labor per sq ft
        
        const totalCost = materialCost + hardwareCost + laborCost;
        
        return {
            area: Math.round(area),
            linearFeet: Math.round(linearFeet),
            boardFeet: Math.round(boardFeet),
            materialCost: Math.round(materialCost),
            hardwareCost: Math.round(hardwareCost),
            laborCost: Math.round(laborCost),
            totalCost: Math.round(totalCost),
            breakdown: {
                framingFactor: `${framingFactor} LF/sq ft`,
                spacingFactor: `${Math.round(spacingFactor * 100)}%`,
                pricePerBF: `$${pricePerBF}`
            }
        };
    }

    calculateRoofing(inputs) {
        const { length, width, pitch, material, complexity, tearOff } = inputs;
        
        // Calculate roof area
        const footprint = length * width;
        const pitchMultipliers = {
            '3/12': 1.031, '4/12': 1.054, '5/12': 1.083, '6/12': 1.118,
            '7/12': 1.158, '8/12': 1.202, '9/12': 1.250, '10/12': 1.302, '12/12': 1.414
        };
        const pitchMultiplier = pitchMultipliers[pitch] || 1.118;
        const roofArea = footprint * pitchMultiplier;
        
        // Convert to squares (100 sq ft units)
        const baseSquares = roofArea / 100;
        
        // Complexity factor
        const complexityFactors = { simple: 1.0, moderate: 1.15, complex: 1.35 };
        const complexityFactor = complexityFactors[complexity] || 1.0;
        const squares = baseSquares * complexityFactor;
        
        // Material pricing
        const materialPricing = {
            'asphalt-shingles': 85, 'architectural-shingles': 125, 'metal-panels': 200,
            'metal-shingles': 280, 'tile-clay': 350, 'tile-concrete': 180
        };
        const materialPrice = materialPricing[material] || 85;
        const materialCost = squares * materialPrice;
        
        // Labor pricing
        const laborRates = {
            'asphalt-shingles': 65, 'architectural-shingles': 75, 'metal-panels': 85,
            'metal-shingles': 120, 'tile-clay': 150, 'tile-concrete': 110
        };
        const laborRate = laborRates[material] || 65;
        const laborCost = squares * laborRate;
        
        // Additional costs
        const underlaymentCost = squares * 25;
        const flashingCost = squares * 15;
        const permitCost = 150;
        const tearOffCost = tearOff ? squares * 45 : 0;
        
        const totalCost = materialCost + laborCost + underlaymentCost + flashingCost + permitCost + tearOffCost;
        
        return {
            footprint: Math.round(footprint),
            roofArea: Math.round(roofArea),
            squares: Math.round(squares * 10) / 10,
            materialCost: Math.round(materialCost),
            laborCost: Math.round(laborCost),
            underlaymentCost: Math.round(underlaymentCost),
            flashingCost: Math.round(flashingCost),
            permitCost: permitCost,
            tearOffCost: Math.round(tearOffCost),
            totalCost: Math.round(totalCost),
            breakdown: {
                pitchMultiplier: pitchMultiplier,
                complexityFactor: complexityFactor,
                materialPerSquare: `$${materialPrice}`,
                laborPerSquare: `$${laborRate}`
            }
        };
    }

    calculatePaint(inputs) {
        const { wallArea, openings, coats, texture, quality, needsPrimer } = inputs;
        
        // Calculate paintable area
        const paintableArea = Math.max(0, wallArea - openings);
        
        // Coverage rates
        const coverageRates = { smooth: 400, light: 350, medium: 300, heavy: 250, stucco: 200 };
        const coverageRate = coverageRates[texture] || 400;
        
        // Paint requirements
        const paintNeeded = (paintableArea * coats) / coverageRate;
        const paintGallons = Math.ceil(paintNeeded * 4) / 4; // Round to nearest quart
        
        // Primer requirements
        const primerGallons = needsPrimer ? Math.ceil(paintableArea / coverageRate * 4) / 4 : 0;
        
        // Pricing
        const paintPricing = { economy: 35, standard: 55, premium: 75, luxury: 95 };
        const primerPricing = { economy: 30, standard: 45, premium: 60, luxury: 75 };
        const paintPrice = paintPricing[quality] || 55;
        const primerPrice = primerPricing[quality] || 45;
        
        // Costs
        const paintCost = paintGallons * paintPrice;
        const primerCost = primerGallons * primerPrice;
        const materialCost = paintCost + primerCost;
        const laborCost = paintableArea * 2.50; // Labor per sq ft
        
        const totalCost = materialCost + laborCost;
        
        return {
            paintableArea: Math.round(paintableArea),
            paintGallons: paintGallons,
            primerGallons: primerGallons,
            paintCost: Math.round(paintCost),
            primerCost: Math.round(primerCost),
            materialCost: Math.round(materialCost),
            laborCost: Math.round(laborCost),
            totalCost: Math.round(totalCost),
            breakdown: {
                coverageRate: `${coverageRate} sq ft/gal`,
                coatsApplied: coats,
                paintPricePerGal: `$${paintPrice}`,
                laborPerSqFt: '$2.50'
            }
        };
    }

    calculateElectrical(inputs) {
        const { area, outlets, switches, fixtures, serviceSize, wireType } = inputs;
        
        // Wire pricing (per linear foot)
        const wirePricing = { copper: 1.25, aluminum: 0.85 };
        const wirePrice = wirePricing[wireType] || 1.25;
        
        // Estimated wire length (rough calculation)
        const wireLength = area * 3 + outlets * 15 + switches * 12 + fixtures * 20; // Approximate wire runs
        const wireCost = wireLength * wirePrice;
        
        // Component costs
        const outletCost = outlets * 25; // $25 per outlet installed
        const switchCost = switches * 35; // $35 per switch installed
        const fixtureCost = fixtures * 150; // $150 per fixture installed
        
        // Panel costs
        const panelCosts = { 100: 800, 200: 1200, 400: 2000 };
        const panelCost = panelCosts[serviceSize] || 1200;
        
        // Labor costs
        const laborRate = 75; // per hour
        const estimatedHours = Math.ceil((outlets + switches + fixtures) * 0.75 + area * 0.02);
        const laborCost = estimatedHours * laborRate;
        
        // Permit costs
        const permitCost = 200;
        
        const totalCost = wireCost + outletCost + switchCost + fixtureCost + panelCost + laborCost + permitCost;
        
        return {
            area: Math.round(area),
            outlets: outlets,
            switches: switches,
            fixtures: fixtures,
            wireLength: Math.round(wireLength),
            wireCost: Math.round(wireCost),
            outletCost: Math.round(outletCost),
            switchCost: Math.round(switchCost),
            fixtureCost: Math.round(fixtureCost),
            panelCost: panelCost,
            laborCost: Math.round(laborCost),
            permitCost: permitCost,
            totalCost: Math.round(totalCost),
            breakdown: {
                wireType: wireType,
                wirePricePerFt: `$${wirePrice}`,
                estimatedHours: estimatedHours,
                laborRate: `$${laborRate}/hr`
            }
        };
    }

    calculateHVAC(inputs) {
        const { area, ceilingHeight, insulation, systemType, ductwork } = inputs;
        
        // BTU calculation
        const insulationFactors = { poor: 40, average: 30, good: 20, excellent: 15 };
        const btuFactor = insulationFactors[insulation] || 30;
        const volume = area * ceilingHeight;
        const btuRequired = area * btuFactor;
        const tonnage = Math.ceil(btuRequired / 12000 * 10) / 10; // Round to nearest 0.1 ton
        
        // Equipment costs
        const equipmentCosts = {
            'central-air': tonnage * 2500,
            'heat-pump': tonnage * 3500,
            'mini-split': tonnage * 3000,
            'window-units': tonnage * 800
        };
        const equipmentCost = equipmentCosts[systemType] || tonnage * 2500;
        
        // Ductwork costs
        const ductworkCost = ductwork ? area * 8 : 0; // $8 per sq ft for new ductwork
        
        // Installation costs
        const installationRates = {
            'central-air': tonnage * 1200,
            'heat-pump': tonnage * 1500,
            'mini-split': tonnage * 1000,
            'window-units': tonnage * 200
        };
        const installationCost = installationRates[systemType] || tonnage * 1200;
        
        // Permit costs
        const permitCost = 150;
        
        const totalCost = equipmentCost + ductworkCost + installationCost + permitCost;
        
        return {
            area: Math.round(area),
            volume: Math.round(volume),
            btuRequired: Math.round(btuRequired),
            tonnage: tonnage,
            equipmentCost: Math.round(equipmentCost),
            ductworkCost: Math.round(ductworkCost),
            installationCost: Math.round(installationCost),
            permitCost: permitCost,
            totalCost: Math.round(totalCost),
            breakdown: {
                btuPerSqFt: btuFactor,
                systemType: systemType,
                insulationLevel: insulation,
                ductworkIncluded: ductwork ? 'Yes' : 'No'
            }
        };
    }

    // Event handling
    setupEventListeners() {
        // Listen for form submissions
        document.addEventListener('submit', (e) => {
            const form = e.target.closest('.calculator-form');
            if (form) {
                e.preventDefault();
                this.handleFormSubmission(form);
            }
        });

        // Listen for input changes for real-time calculation
        document.addEventListener('input', (e) => {
            const form = e.target.closest('.calculator-form');
            if (form && form.dataset.realtime === 'true') {
                this.debounce(() => this.handleFormSubmission(form), 500)();
            }
        });
    }

    // Handle form submission
    handleFormSubmission(form) {
        const calculatorId = form.dataset.calculator;
        if (!calculatorId) return;

        try {
            // Collect form data
            const formData = new FormData(form);
            const inputs = {};
            
            for (const [key, value] of formData.entries()) {
                inputs[key] = value;
            }

            // Add checkbox states (they don't appear in FormData if unchecked)
            const checkboxes = form.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                inputs[checkbox.name] = checkbox.checked;
            });

            // Perform calculation
            const results = this.calculate(calculatorId, inputs);
            
            // Display results
            this.displayResults(calculatorId, results);
            
        } catch (error) {
            this.displayError(calculatorId, error.message);
        }
    }

    // Display calculation results
    displayResults(calculatorId, results) {
        const resultsContainer = document.getElementById(`${calculatorId}-results`);
        const resultsContent = document.getElementById(`${calculatorId}-results-content`);
        
        if (!resultsContainer || !resultsContent) return;

        // Show results container
        resultsContainer.style.display = 'block';
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        // Format and display results
        const formattedResults = this.formatResults(results);
        resultsContent.innerHTML = formattedResults.map(([label, value]) => `
            <div class="result-item">
                <span class="result-label">${label}:</span>
                <span class="result-value">${value}</span>
            </div>
        `).join('');

        // Enable export buttons
        this.enableExportButtons(calculatorId);
    }

    // Display error message
    displayError(calculatorId, message) {
        const resultsContainer = document.getElementById(`${calculatorId}-results`);
        const resultsContent = document.getElementById(`${calculatorId}-results-content`);
        
        if (!resultsContainer || !resultsContent) return;

        resultsContainer.style.display = 'block';
        resultsContent.innerHTML = `
            <div class="error-message" style="color: var(--danger); padding: 1rem; background: #FEF2F2; border-radius: var(--radius); border: 1px solid #FECACA;">
                <strong>Calculation Error:</strong> ${message}
            </div>
        `;
    }

    // Format results for display
    formatResults(results) {
        const formatted = [];
        
        for (const [key, value] of Object.entries(results)) {
            if (key === 'breakdown') continue; // Handle breakdown separately
            
            const label = this.formatLabel(key);
            const formattedValue = this.formatValue(key, value);
            formatted.push([label, formattedValue]);
        }
        
        return formatted;
    }

    // Format label for display
    formatLabel(key) {
        return key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }

    // Format value for display
    formatValue(key, value) {
        if (typeof value === 'number') {
            if (key.toLowerCase().includes('cost') || key.toLowerCase().includes('price')) {
                return `$${value.toLocaleString()}`;
            } else if (key.includes('area') || key.includes('volume')) {
                return value.toLocaleString();
            } else {
                return value.toLocaleString();
            }
        }
        return String(value);
    }

    // Enable export buttons
    enableExportButtons(calculatorId) {
        const buttons = document.querySelectorAll(`#${calculatorId}-results .btn`);
        buttons.forEach(btn => {
            btn.disabled = false;
            btn.style.opacity = '1';
        });
    }

    // Event listener management
    addEventListener(calculatorId, event, callback) {
        if (!this.listeners.has(calculatorId)) {
            this.listeners.set(calculatorId, new Map());
        }
        
        const calcListeners = this.listeners.get(calculatorId);
        if (!calcListeners.has(event)) {
            calcListeners.set(event, []);
        }
        
        calcListeners.get(event).push(callback);
    }

    removeEventListener(calculatorId, event, callback) {
        const calcListeners = this.listeners.get(calculatorId);
        if (!calcListeners) return;
        
        const eventListeners = calcListeners.get(event);
        if (!eventListeners) return;
        
        const index = eventListeners.indexOf(callback);
        if (index > -1) {
            eventListeners.splice(index, 1);
        }
    }

    notifyListeners(calculatorId, event, data) {
        const calcListeners = this.listeners.get(calculatorId);
        if (!calcListeners) return;
        
        const eventListeners = calcListeners.get(event);
        if (!eventListeners) return;
        
        eventListeners.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error('Listener error:', error);
            }
        });
    }

    // Utility methods
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Get results for export
    getResults(calculatorId) {
        return this.results.get(calculatorId);
    }

    // Clear results
    clearResults(calculatorId) {
        this.results.delete(calculatorId);
        const resultsContainer = document.getElementById(`${calculatorId}-results`);
        if (resultsContainer) {
            resultsContainer.style.display = 'none';
        }
    }
}

// Create global instance
window.CalculatorEngine = CalculatorEngine;
window.calculatorEngine = new CalculatorEngine();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CalculatorEngine;
}

console.log('✅ Calculator Engine loaded successfully');