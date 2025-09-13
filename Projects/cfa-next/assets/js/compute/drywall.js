/**
 * Drywall Calculator Compute Module
 * Handles drywall sheet calculation, material costs, and labor estimation
 *
 * Calculation Rules:
 * - Total area = wall area + ceiling area
 * - Sheets needed = ceil((area * wasteFactor) / sheetArea)
 * - Sheet area: 4x8 = 32 sq ft, 4x12 = 48 sq ft
 * - Level factors: L3=1.0, L4=1.2, L5=1.6 (affects finish time)
 * - Labor: hanging + finishing (with level adjustment)
 * - Material cost: (sheets * sheetCost) + (area * mudRate)
 * - Total cost: material + labor
 */

(function() {
    // Helper parsers
    const num = v => { const x = parseFloat(String(v).replace(/[$,]/g,'')); return isNaN(x)?0:x; };
    const clamp = (v,min,max)=> Math.min(max, Math.max(min, v));
    const round1 = v => Math.round(v*10)/10;
    const $ = (s,sel)=> s.querySelector(sel);

    // Main compute function
    function compute_drywall(section) {
        // Read inputs (scoped to this section)
        const wall = num($(section, '#dw-wall-area')?.value || 0);
        const ceil = num($(section, '#dw-ceiling-area')?.value || 0);
        const sheetSize = $(section, '#dw-sheet-size')?.value || '4x12';
        const wastePct = clamp(num($(section, '#dw-waste')?.value || 10), 0, 50);
        const level = $(section, '#dw-level')?.value || 'L4';
        let sheetCost = num($(section, '#dw-sheet-cost')?.value) || (sheetSize === '4x12' ? 16 : 12);
        const mudRate = num($(section, '#dw-mud-rate')?.value) || 0.25;
        const laborRate = num($(section, '#dw-labor-rate')?.value) || 55;
        const prodHang = Math.max(1, num($(section, '#dw-prod-hang')?.value) || 50);
        const prodFinish = Math.max(1, num($(section, '#dw-prod-finish')?.value) || 35);

        // Validate required inputs
        if (wall <= 0 && ceil <= 0) {
            throw new Error('Wall area or ceiling area must be greater than 0');
        }

        // Calculate total area
        const area = Math.max(0, wall + ceil);

        // Calculate sheets needed
        const wasteFactor = 1 + (wastePct / 100);
        const sheetArea = sheetSize === '4x12' ? 48 : 32; // sq ft per sheet
        const sheets = Math.ceil((area * wasteFactor) / sheetArea);

        // Calculate labor hours
        const levelFactors = { L3: 1.0, L4: 1.2, L5: 1.6 };
        const levelFactor = levelFactors[level] || 1.2;
        const hangHours = area / prodHang;
        const finishHours = (area / prodFinish) * levelFactor;
        const laborHours = round1(hangHours + finishHours);

        // Calculate costs
        const materialCost = round1((sheets * sheetCost) + (area * mudRate));
        const laborCost = round1(laborHours * laborRate);
        const totalCost = round1(materialCost + laborCost);

        // Prepare result objects
        const inputs = {
            wall,
            ceil,
            sheetSize,
            wastePct,
            level,
            sheetCost,
            mudRate,
            laborRate,
            prodHang,
            prodFinish
        };

        const results = {
            area,
            sheets,
            materialCost,
            laborHours,
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

        // Write results (scoped to section)
        const updates = {
            '#dw-sheets': results.sheets.toString(),
            '#dw-material': '$' + results.materialCost.toLocaleString(),
            '#dw-labor-hours': results.laborHours.toString() + ' hrs',
            '#dw-labor': '$' + results.laborCost.toLocaleString(),
            '#dw-total': '$' + results.totalCost.toLocaleString()
        };

        Object.entries(updates).forEach(([selector, value]) => {
            const element = section.querySelector(selector);
            if (element) {
                element.textContent = value;
            }
        });
    }

    // Expose compute function globally for hub dispatcher
    window.compute_drywall = compute_drywall;

    console.log('Drywall compute module loaded');
})();