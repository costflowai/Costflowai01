/**
 * Framing Calculator - Wood Framing Cost Estimation
 * Calculates studs, plates, and labor for wall framing
 */

window.compute_framing = (section) => {
    // Get inputs from section-scoped DOM
    const lengthFt = parseFloat(section.querySelector('#fr-length-ft')?.value || 0);
    const heightFt = parseFloat(section.querySelector('#fr-height-ft')?.value || 0);
    const spacingIn = parseFloat(section.querySelector('#fr-spacing-in')?.value || 16);
    const corners = parseInt(section.querySelector('#fr-corners')?.value || 0);
    const openings = parseInt(section.querySelector('#fr-openings')?.value || 0);
    const waste = parseFloat(section.querySelector('#fr-waste')?.value || 10);
    const studCost = parseFloat(section.querySelector('#fr-stud-cost')?.value || 4.50);
    const plateCost = parseFloat(section.querySelector('#fr-plate-cost')?.value || 1.25);
    const laborRate = parseFloat(section.querySelector('#fr-labor-rate')?.value || 65);
    const productivity = parseFloat(section.querySelector('#fr-productivity')?.value || 40);

    // Validation
    if (lengthFt <= 0 || heightFt <= 0) {
        throw new Error('Wall length and height must be greater than 0');
    }

    // Calculate studs required
    // Basic formula: (length in inches / spacing) + 1, plus corners and openings
    const lengthIn = lengthFt * 12;
    const studSpacing = Math.max(12, Math.min(24, spacingIn)); // Clamp between 12-24

    let studCount = Math.floor(lengthIn / studSpacing) + 1; // Base studs
    studCount += corners * 2; // Extra studs for corners
    studCount += openings * 2; // King and jack studs for openings

    // Apply waste factor
    const studCountWithWaste = Math.ceil(studCount * (1 + waste / 100));

    // Calculate plates (top and bottom plates)
    const platesLinearFt = lengthFt * 2; // Top and bottom plate
    const platesWithWaste = platesLinearFt * (1 + waste / 100);

    // Material costs
    const studMaterialCost = studCountWithWaste * studCost;
    const plateMaterialCost = platesWithWaste * plateCost;
    const totalMaterialCost = studMaterialCost + plateMaterialCost;

    // Labor calculation
    const laborHours = lengthFt / productivity;
    const laborCost = laborHours * laborRate;

    // Total cost
    const totalCost = totalMaterialCost + laborCost;

    // Update results in section-scoped DOM
    section.querySelector('#fr-studs').textContent = studCountWithWaste.toString();
    section.querySelector('#fr-plates').textContent = `${platesWithWaste.toFixed(1)} lf`;
    section.querySelector('#fr-material').textContent = `$${totalMaterialCost.toFixed(2)}`;
    section.querySelector('#fr-labor-hours').textContent = `${laborHours.toFixed(1)} hrs`;
    section.querySelector('#fr-labor').textContent = `$${laborCost.toFixed(2)}`;
    section.querySelector('#fr-total').textContent = `$${totalCost.toFixed(2)}`;

    // Return structured results
    return {
        inputs: {
            lengthFt,
            heightFt,
            spacingIn,
            corners,
            openings,
            waste,
            studCost,
            plateCost,
            laborRate,
            productivity
        },
        results: {
            studCount: studCountWithWaste,
            platesLinearFt: platesWithWaste,
            materialCost: totalMaterialCost,
            laborHours,
            laborCost,
            totalCost
        },
        meta: {
            type: 'framing',
            timestamp: Date.now(),
            calculation: {
                baseStuds: Math.floor(lengthIn / studSpacing) + 1,
                cornerStuds: corners * 2,
                openingStuds: openings * 2,
                wasteApplied: waste
            }
        }
    };
};