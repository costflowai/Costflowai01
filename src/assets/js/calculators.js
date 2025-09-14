/**
 * Calculator Functions
 */
(function(window) {
    'use strict';

    // Concrete
    window.compute_concrete = function(section) {
        const l = parseFloat(section.querySelector('[name="length"]')?.value) || 0;
        const w = parseFloat(section.querySelector('[name="width"]')?.value) || 0;
        const t = parseFloat(section.querySelector('[name="thickness"]')?.value) || 4;
        const cf = l * w * (t/12);
        const cy = cf / 27;
        const bags = Math.ceil(cf / 0.6);
        const cost = bags * 6.50;
        
        const results = {
            cubicFeet: cf.toFixed(2),
            cubicYards: cy.toFixed(2),
            bags80lb: bags,
            totalCost: cost.toFixed(2)
        };
        
        window.lastCalculation = {
            type: 'concrete',
            timestamp: new Date().toISOString(),
            inputs: {length:l, width:w, thickness:t},
            results
        };
        window.lastCalculationByType.concrete = window.lastCalculation;
        displayResults(section, results);
        return results;
    };

    // Paint
    window.compute_paint = function(section) {
        const l = parseFloat(section.querySelector('[name="wallLength"]')?.value) || 0;
        const h = parseFloat(section.querySelector('[name="wallHeight"]')?.value) || 8;
        const n = parseFloat(section.querySelector('[name="numWalls"]')?.value) || 4;
        const c = parseFloat(section.querySelector('[name="coats"]')?.value) || 2;
        const area = l * h * n * 0.85;
        const gal = Math.ceil(area / 350 * c);
        const cost = gal * 35;
        
        const results = {
            paintableArea: area.toFixed(0),
            gallonsNeeded: gal,
            totalCost: cost.toFixed(2)
        };
        
        window.lastCalculation = {
            type: 'paint',
            timestamp: new Date().toISOString(),
            inputs: {wallLength:l, wallHeight:h, numWalls:n, coats:c},
            results
        };
        window.lastCalculationByType.paint = window.lastCalculation;
        displayResults(section, results);
        return results;
    };

    // Drywall
    window.compute_drywall = function(section) {
        const l = parseFloat(section.querySelector('[name="roomLength"]')?.value) || 0;
        const w = parseFloat(section.querySelector('[name="roomWidth"]')?.value) || 0;
        const h = parseFloat(section.querySelector('[name="ceilingHeight"]')?.value) || 8;
        const area = (2*(l+w)*h) + (l*w);
        const sheets = Math.ceil(area / 32 * 1.1);
        const compound = Math.ceil(area / 500);
        const screws = Math.ceil(area / 500);
        const cost = sheets*12 + compound*15 + screws*8;
        
        const results = {
            totalArea: area.toFixed(0),
            sheetsNeeded: sheets,
            jointCompound: compound,
            totalCost: cost.toFixed(2)
        };
        
        window.lastCalculation = {
            type: 'drywall',
            timestamp: new Date().toISOString(),
            inputs: {roomLength:l, roomWidth:w, ceilingHeight:h},
            results
        };
        window.lastCalculationByType.drywall = window.lastCalculation;
        displayResults(section, results);
        return results;
    };

    // Framing
    window.compute_framing = function(section) {
        const l = parseFloat(section.querySelector('[name="wallLength"]')?.value) || 0;
        const h = parseFloat(section.querySelector('[name="wallHeight"]')?.value) || 8;
        const s = parseFloat(section.querySelector('[name="studSpacing"]')?.value) || 16;
        const studs = Math.ceil((l*12)/s) + 1;
        const plates = Math.ceil(l/8) * 2;
        const lf = studs*h + l*2;
        const bf = lf * (2*4) / 12;
        const cost = bf * 0.75;
        
        const results = {
            studsNeeded: studs,
            boardFeet: bf.toFixed(0),
            totalCost: cost.toFixed(2)
        };
        
        window.lastCalculation = {
            type: 'framing',
            timestamp: new Date().toISOString(),
            inputs: {wallLength:l, wallHeight:h, studSpacing:s},
            results
        };
        window.lastCalculationByType.framing = window.lastCalculation;
        displayResults(section, results);
        return results;
    };

    function displayResults(section, results) {
        const container = section.querySelector('.results, [data-results]');
        if (!container) return;
        
        let html = '<h3>Results</h3>';
        for (const [key, value] of Object.entries(results)) {
            const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
            html += `<div><span>${label}:</span> <strong>${value}</strong></div>`;
        }
        container.innerHTML = html;
        container.style.display = 'block';
    }

})(window);
