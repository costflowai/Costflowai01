/**
 * Paint Calculator - Professional paint estimation
 * Computes paint requirements based on room dimensions and openings
 */

/**
 * Compute paint requirements for a room
 * @param {HTMLElement} section - Paint calculator section
 * @returns {Object} Paint calculation results
 */
function compute_paint(section) {
    // Extract input values using validator utilities
    const lengthField = section.querySelector('[name="length"]');
    const widthField = section.querySelector('[name="width"]');
    const heightField = section.querySelector('[name="height"]');
    const doorsField = section.querySelector('[name="doors"]');
    const windowsField = section.querySelector('[name="windows"]');

    const length = validatorUtils.getFieldValue(lengthField);
    const width = validatorUtils.getFieldValue(widthField);
    const height = validatorUtils.getFieldValue(heightField);
    const doors = validatorUtils.getFieldValue(doorsField) || 1;
    const windows = validatorUtils.getFieldValue(windowsField) || 2;

    // Validate required inputs
    if (!length || !width || !height) {
        throw new Error('Length, width, and height are required');
    }

    if (length <= 0 || width <= 0 || height <= 0) {
        throw new Error('Dimensions must be positive values');
    }

    // Constants for paint calculation
    const DOOR_AREA = 20; // sq ft per door
    const WINDOW_AREA = 15; // sq ft per window
    const COVERAGE_PER_GALLON = 350; // sq ft per gallon (typical)
    const WASTE_FACTOR = 1.1; // 10% waste factor
    const PAINT_COST_PER_GALLON = 45; // Average paint cost

    // Calculate wall areas
    const wall1Area = length * height * 2; // Two walls
    const wall2Area = width * height * 2; // Two walls
    const totalWallArea = wall1Area + wall2Area;

    // Subtract openings
    const doorArea = doors * DOOR_AREA;
    const windowArea = windows * WINDOW_AREA;
    const openingArea = doorArea + windowArea;

    // Net paintable area
    const netArea = Math.max(totalWallArea - openingArea, 0);

    // Account for waste
    const adjustedArea = netArea * WASTE_FACTOR;

    // Calculate paint needed
    const gallonsNeeded = Math.ceil(adjustedArea / COVERAGE_PER_GALLON * 100) / 100; // Round up to nearest 0.01

    // Calculate costs
    const materialCost = gallonsNeeded * PAINT_COST_PER_GALLON;
    const laborCost = netArea * 1.5; // $1.50 per sq ft for labor
    const totalCost = materialCost + laborCost;

    // Prepare results
    const results = {
        wall_area: validatorUtils.formatNumber(netArea, 0) + ' sq ft',
        gallons: validatorUtils.formatNumber(gallonsNeeded, 2),
        cost: validatorUtils.formatCurrency(totalCost)
    };

    // Additional detailed results for internal use
    results._detailed = {
        totalWallArea: totalWallArea,
        doorArea: doorArea,
        windowArea: windowArea,
        openingArea: openingArea,
        netArea: netArea,
        adjustedArea: adjustedArea,
        gallonsNeeded: gallonsNeeded,
        materialCost: materialCost,
        laborCost: laborCost,
        totalCost: totalCost,
        inputs: {
            length: length,
            width: width,
            height: height,
            doors: doors,
            windows: windows
        }
    };

    return results;
}

// Register paint calculator with the hub
document.addEventListener('DOMContentLoaded', function() {
    if (window.calculatorHub) {
        window.calculatorHub.registerCompute('paint', compute_paint);
    }
});

// Export for testing
window.compute_paint = compute_paint;