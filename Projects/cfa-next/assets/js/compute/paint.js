/**
 * Paint Calculator Compute Module
 * Handles paint estimation calculations with configurable parameters
 *
 * Calculation Rules:
 * - netArea = max(0, area - openings)
 * - Coverage base by texture: smooth=350, medium=300, heavy=250 (override input if blank)
 * - Gallons = (netArea * coats) / coverage, round up to 0.1 gal
 * - Primer gallons = netArea / 400 if primer checked
 * - Material rate by quality default: builder=22, standard=34, premium=48 (overridden by input)
 * - Labor hours = netArea / productivity
 * - Costs: matCost = (gals*rate) + (primerGals*rate*0.6), laborCost = hours*laborRate, total = matCost + laborCost
 */

(function() {
    // Light parsing helpers (local only)
    const num = v => { const x = parseFloat(String(v).replace(/[$,]/g,'')); return isNaN(x)?0:x; };
    const clamp = (v,min,max)=> Math.min(max, Math.max(min, v));
    const round1 = v => Math.ceil(v*10)/10;
    const $ = (section, sel) => section.querySelector(sel);

    // Default values by configuration
    const COVERAGE_BY_TEXTURE = {
        smooth: 350,
        medium: 300,
        heavy: 250
    };

    const MATERIAL_RATE_BY_QUALITY = {
        builder: 22,
        standard: 34,
        premium: 48
    };

    const PRIMER_COVERAGE = 400; // sq ft per gallon
    const PRIMER_RATE_MULTIPLIER = 0.6; // 60% of paint rate for primer

    function formatCurrency(value) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(value);
    }

    function formatNumber(value, decimals = 1) {
        return parseFloat(value).toFixed(decimals);
    }

    // Main compute function
    function compute_paint(section) {
        // Read inputs from section
        const area = num($(section, '#paint-area')?.value || 0);
        const openings = num($(section, '#paint-openings')?.value || 0);
        const coats = clamp(num($(section, '#paint-coats')?.value || 2), 1, 4);
        const texture = $(section, '#paint-texture')?.value || 'medium';
        const quality = $(section, '#paint-quality')?.value || 'standard';
        const primer = $(section, '#paint-primer')?.checked || false;
        const coverageInput = num($(section, '#paint-coverage')?.value || 0);
        const matRateInput = num($(section, '#paint-mat-rate')?.value || 0);
        const laborRate = num($(section, '#paint-labor-rate')?.value || 55);
        const productivity = num($(section, '#paint-productivity')?.value || 250);

        // Validate required inputs
        if (area <= 0) {
            throw new Error('Total area must be greater than 0');
        }

        // Calculate net area
        const netArea = Math.max(0, area - openings);

        // Determine coverage (use input or default by texture)
        const coverage = coverageInput > 0 ? coverageInput : COVERAGE_BY_TEXTURE[texture];

        // Calculate paint gallons needed (round up to 0.1 gal)
        const gallons = round1((netArea * coats) / coverage);

        // Calculate primer gallons if needed
        const primerGallons = primer ? round1(netArea / PRIMER_COVERAGE) : 0;

        // Determine material rate (use input or default by quality)
        const materialRate = matRateInput > 0 ? matRateInput : MATERIAL_RATE_BY_QUALITY[quality];

        // Calculate labor hours
        const laborHours = netArea / productivity;

        // Calculate costs
        const paintCost = gallons * materialRate;
        const primerCost = primerGallons * materialRate * PRIMER_RATE_MULTIPLIER;
        const materialCost = paintCost + primerCost;
        const laborCost = laborHours * laborRate;
        const totalCost = materialCost + laborCost;

        // Prepare input/result objects
        const inputs = {
            area,
            openings,
            coats,
            texture,
            quality,
            primer,
            coverage,
            materialRate,
            laborRate,
            productivity
        };

        const results = {
            netArea,
            gallons,
            primerGallons,
            laborHours,
            materialCost,
            laborCost,
            totalCost
        };

        // Update DOM with results
        updateResultsDOM(section, results);

        // Return structured result for dispatcher
        return {
            inputs,
            results
        };
    }

    function updateResultsDOM(section, results) {
        // Show results section
        const resultsDiv = section.querySelector('.results');
        if (resultsDiv) {
            resultsDiv.style.display = 'block';
        }

        // Update individual result elements
        const updates = {
            '#paint-gallons': formatNumber(results.gallons) + ' gal',
            '#paint-primer-gallons': formatNumber(results.primerGallons) + ' gal',
            '#paint-material': formatCurrency(results.materialCost),
            '#paint-labor-hours': formatNumber(results.laborHours) + ' hrs',
            '#paint-labor': formatCurrency(results.laborCost),
            '#paint-total': formatCurrency(results.totalCost)
        };

        Object.entries(updates).forEach(([selector, value]) => {
            const element = section.querySelector(selector);
            if (element) {
                element.textContent = value;
            }
        });
    }

    // Expose compute function globally for hub dispatcher
    window.compute_paint = compute_paint;

    console.log('Paint compute module loaded');
})();