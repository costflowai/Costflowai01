/**
 * CFA Calculator Suite - Smoke Tests
 * Headless JSDOM tests for Paint & Drywall calculators
 * Verifies manual-only computation, tab navigation, and button states
 */

import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';
import { writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// Test results tracking
const testResults = {
  summary: { total: 0, passed: 0, failed: 0 },
  tests: []
};

let exitCode = 0;

function log(message) {
  console.log(`[SMOKE] ${message}`);
}

function assert(condition, message) {
  testResults.summary.total++;

  if (condition) {
    testResults.summary.passed++;
    testResults.tests.push({ name: message, status: 'PASS' });
    log(`✓ ${message}`);
  } else {
    testResults.summary.failed++;
    testResults.tests.push({ name: message, status: 'FAIL' });
    log(`✗ ${message}`);
    exitCode = 1;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function setupDOM() {
  log('Setting up JSDOM environment...');

  // Read the HTML file
  const htmlPath = path.join(projectRoot, 'calculators', 'index.html');
  const htmlContent = readFileSync(htmlPath, 'utf-8');

  // Create JSDOM instance
  const dom = new JSDOM(htmlContent, {
    url: 'http://localhost:3000/calculators/',
    pretendToBeVisual: true,
    runScripts: 'dangerously',
    // resources: .usable.
  });
  const { window } = dom;

  // Set up globals properly for JSDOM
  global.window = window;
  global.document = window.document;
  global.HTMLElement = window.HTMLElement;
  global.Event = window.Event;
  global.MouseEvent = window.MouseEvent;

  // Mock fetch for calculator inventory
  window.fetch = async (url) => {
    if (url.includes('/data/calculator-inventory.json')) {
      return {
        ok: true,
        json: async () => [
          {"slug":"concrete","title":"Concrete"},
          {"slug":"paint","title":"Paint Pro"},
          {"slug":"drywall","title":"Drywall"},
          {"slug":"framing","title":"Framing"}
        ]
      };
    }
    throw new Error(`Unmocked fetch: ${url}`);
  };

  return { dom, window };
}

async function loadScripts(window) {
  log('Loading calculator scripts...');

  const scripts = [
    'assets/js/render-calculators.js',
    'assets/js/compute/paint.js',
    'assets/js/compute/drywall.js',
    'assets/js/compute/framing.js',
    'assets/js/calculators-hub.js'
  ];

  for (const scriptPath of scripts) {
    const fullPath = path.join(projectRoot, scriptPath);
    const scriptContent = readFileSync(fullPath, 'utf-8');

    // Execute script in window context
    const script = window.document.createElement('script');
    script.textContent = scriptContent;
    window.document.head.appendChild(script);

    // Small delay to allow script execution
    await sleep(10);
  }

  // Wait for DOM ready and initialization
  await sleep(100);

  // Manually trigger DOMContentLoaded if needed
  if (window.calculatorRenderer) {
    log('Calculator renderer already initialized');
  } else {
    const event = new window.Event('DOMContentLoaded');
    window.document.dispatchEvent(event);
    await sleep(100);
  }
}

async function waitForTabsToRender(window) {
  log('Waiting for tabs and panels to render...');

  let retries = 10;
  while (retries > 0) {
    const tabs = window.document.querySelectorAll('[role="tab"]');
    const panels = window.document.querySelectorAll('[role="tabpanel"]');

    if (tabs.length >= 4 && panels.length >= 4) {
      log(`Found ${tabs.length} tabs and ${panels.length} panels`);
      return true;
    }

    await sleep(50);
    retries--;
  }

  return false;
}

function navigateToTab(window, slug) {
  log(`Navigating to #${slug}...`);

  window.location.hash = `#${slug}`;

  // Manually trigger hashchange event
  const hashEvent = new window.Event('hashchange');
  window.dispatchEvent(hashEvent);

  // Also directly call renderer if available
  if (window.calculatorRenderer) {
    window.calculatorRenderer.selectTab(slug);
  }
}

function fillPaintInputs(window) {
  log('Filling Paint calculator inputs...');

  const section = window.document.querySelector('#paint-calc');
  if (!section) throw new Error('Paint section not found');

  // Fill inputs as specified
  section.querySelector('#paint-area').value = '400';
  section.querySelector('#paint-openings').value = '40';
  section.querySelector('#paint-coats').value = '2';
  section.querySelector('#paint-texture').value = 'smooth';
  section.querySelector('#paint-quality').value = 'standard';
  section.querySelector('#paint-primer').checked = true;
  section.querySelector('#paint-labor-rate').value = '55';
  section.querySelector('#paint-productivity').value = '250';
}

function fillDrywallInputs(window) {
  log('Filling Drywall calculator inputs...');

  const section = window.document.querySelector('#drywall-calc');
  if (!section) throw new Error('Drywall section not found');

  // Fill inputs as specified
  section.querySelector('#dw-wall-area').value = '800';
  section.querySelector('#dw-ceiling-area').value = '200';
  section.querySelector('#dw-sheet-size').value = '4x12';
  section.querySelector('#dw-waste').value = '10';
  section.querySelector('#dw-level').value = 'L4';
  // Leave other fields as defaults
}

function fillFramingInputs(window) {
  log('Filling Framing calculator inputs...');

  const section = window.document.querySelector('#framing-calc');
  if (!section) throw new Error('Framing section not found');

  // Fill inputs as specified
  section.querySelector('#fr-length-ft').value = '40';
  section.querySelector('#fr-height-ft').value = '8';
  section.querySelector('#fr-spacing-in').value = '16';
  section.querySelector('#fr-corners').value = '2';
  section.querySelector('#fr-openings').value = '3';
  section.querySelector('#fr-waste').value = '10';
  section.querySelector('#fr-stud-cost').value = '4.50';
  section.querySelector('#fr-plate-cost').value = '1.25';
  section.querySelector('#fr-labor-rate').value = '65';
  section.querySelector('#fr-productivity').value = '40';
}

function assertPreCalculationState(window, slug) {
  const sectionId = `${slug}-calc`;
  const section = window.document.querySelector(`#${sectionId}`);

  // Check results are empty/zero (results should be hidden initially)
  const resultsDiv = section.querySelector('.results');
  const isResultsHidden = resultsDiv.style.display === 'none';
  assert(isResultsHidden, `${slug}: Results section is initially hidden`);

  // Check lastCalculation is undefined for this type
  const hasCalculation = window.lastCalculationByType && window.lastCalculationByType[slug];
  assert(!hasCalculation, `${slug}: No previous calculation stored`);

  // Check action buttons are disabled
  const actionButtons = section.querySelectorAll('[data-action]:not([data-action="calculate"])');
  const allDisabled = Array.from(actionButtons).every(btn => btn.disabled);
  assert(allDisabled, `${slug}: Action buttons are initially disabled`);
}

function assertPostCalculationState(window, slug) {
  // Check lastCalculation is set correctly
  const calculation = window.lastCalculation;
  assert(calculation && calculation.type === slug, `${slug}: lastCalculation.type is correct`);

  const calculationByType = window.lastCalculationByType && window.lastCalculationByType[slug];
  assert(calculationByType && calculationByType.results, `${slug}: lastCalculationByType has results`);

  // Check total cost is positive
  const totalCost = calculationByType.results.totalCost;
  assert(totalCost > 0, `${slug}: Total cost is positive (${totalCost})`);

  // Check action buttons are enabled
  const sectionId = `${slug}-calc`;
  const section = window.document.querySelector(`#${sectionId}`);
  const actionButtons = section.querySelectorAll('[data-action]:not([data-action="calculate"])');
  const allEnabled = Array.from(actionButtons).every(btn => !btn.disabled);
  assert(allEnabled, `${slug}: Action buttons are enabled after calculation`);

  // Check results are visible
  const resultsDiv = section.querySelector('.results');
  const isResultsVisible = resultsDiv.style.display === 'block';
  assert(isResultsVisible, `${slug}: Results section is visible after calculation`);
}

function clickCalculateButton(window, slug) {
  log(`Clicking Calculate button for ${slug}...`);

  const sectionId = `${slug}-calc`;
  const section = window.document.querySelector(`#${sectionId}`);
  const calculateBtn = section.querySelector('[data-action="calculate"]');

  if (!calculateBtn) {
    throw new Error(`Calculate button not found for ${slug}`);
  }

  // Trigger click event
  const clickEvent = new window.MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    view: window
  });

  calculateBtn.dispatchEvent(clickEvent);
}

async function testPaintCalculator(window) {
  log('=== Testing Paint Calculator ===');

  // Navigate to paint tab
  navigateToTab(window, 'paint');
  await sleep(50);

  // Fill inputs
  fillPaintInputs(window);

  // Assert pre-calculation state
  assertPreCalculationState(window, 'paint');

  // Click calculate
  clickCalculateButton(window, 'paint');
  await sleep(100); // Allow calculation to complete

  // Assert post-calculation state
  assertPostCalculationState(window, 'paint');
}

async function testDrywallCalculator(window) {
  log('=== Testing Drywall Calculator ===');

  // Navigate to drywall tab
  navigateToTab(window, 'drywall');
  await sleep(50);

  // Fill inputs
  fillDrywallInputs(window);

  // Assert pre-calculation state
  assertPreCalculationState(window, 'drywall');

  // Click calculate
  clickCalculateButton(window, 'drywall');
  await sleep(100); // Allow calculation to complete

  // Assert post-calculation state
  assertPostCalculationState(window, 'drywall');
}

async function testFramingCalculator(window) {
  log('=== Testing Framing Calculator ===');

  // Navigate to framing tab
  navigateToTab(window, 'framing');
  await sleep(50);

  // Fill inputs
  fillFramingInputs(window);

  // Assert pre-calculation state
  assertPreCalculationState(window, 'framing');

  // Click calculate
  clickCalculateButton(window, 'framing');
  await sleep(100); // Allow calculation to complete

  // Assert post-calculation state
  assertPostCalculationState(window, 'framing');
}

async function testNoAutoCalc(window) {
  log('=== Testing No Auto-Calculation ===');

  // Navigate back to paint
  navigateToTab(window, 'paint');
  await sleep(50);

  // Get current calculation
  const beforeCalculation = window.lastCalculationByType && window.lastCalculationByType.paint;
  const beforeTotal = beforeCalculation ? beforeCalculation.results.totalCost : 0;

  // Change an input value
  const section = window.document.querySelector('#paint-calc');
  const areaInput = section.querySelector('#paint-area');
  areaInput.value = '500'; // Changed from 400

  // Trigger input event
  const inputEvent = new window.Event('input', { bubbles: true });
  areaInput.dispatchEvent(inputEvent);

  await sleep(50);

  // Check that calculation hasn't changed
  const afterCalculation = window.lastCalculationByType && window.lastCalculationByType.paint;
  const afterTotal = afterCalculation ? afterCalculation.results.totalCost : 0;

  assert(beforeTotal === afterTotal, 'No auto-calculation: Results unchanged after input change');

  // Now click calculate to verify it does work
  clickCalculateButton(window, 'paint');
  await sleep(100);

  const newCalculation = window.lastCalculationByType && window.lastCalculationByType.paint;
  const newTotal = newCalculation ? newCalculation.results.totalCost : 0;

  assert(newTotal !== beforeTotal, 'Manual calculation: Results change after Calculate click');
}

async function testTabNavigation(window) {
  log('=== Testing Tab Navigation ===');

  // Test concrete tab (should exist but be placeholder)
  navigateToTab(window, 'concrete');
  await sleep(50);

  const concretePanel = window.document.querySelector('#concrete-calc');
  const isPanelVisible = !concretePanel.hidden;
  assert(isPanelVisible, 'Tab navigation: Concrete panel becomes visible');

  // Test paint tab navigation
  navigateToTab(window, 'paint');
  await sleep(50);

  const paintPanel = window.document.querySelector('#paint-calc');
  const isPaintVisible = !paintPanel.hidden;
  const isConcreteHidden = concretePanel.hidden;

  assert(isPaintVisible, 'Tab navigation: Paint panel becomes visible');
  assert(isConcreteHidden, 'Tab navigation: Previous panel becomes hidden');
}

async function runSmokeTests() {
  try {
    log('Starting CFA Calculator Suite Smoke Tests...');

    // Setup
    const { window } = await setupDOM();
    await loadScripts(window);

    const tabsReady = await waitForTabsToRender(window);
    assert(tabsReady, 'Initial setup: Tabs and panels rendered successfully');

    // Run test suites
    await testTabNavigation(window);
    await testPaintCalculator(window);
    await testDrywallCalculator(window);
    await testFramingCalculator(window);
    await testNoAutoCalc(window);

    // Final summary
    log('');
    log('=== Test Results Summary ===');
    log(`Total Tests: ${testResults.summary.total}`);
    log(`Passed: ${testResults.summary.passed}`);
    log(`Failed: ${testResults.summary.failed}`);

    if (testResults.summary.failed === 0) {
      log('🎉 ALL TESTS PASSED!');
    } else {
      log(`❌ ${testResults.summary.failed} TEST(S) FAILED`);
    }

  } catch (error) {
    log(`Fatal error during testing: ${error.message}`);
    log(error.stack);
    exitCode = 1;

    testResults.tests.push({
      name: 'Test execution',
      status: 'FATAL',
      error: error.message
    });
  }

  // Save results to JSON
  const resultsPath = path.join(projectRoot, 'test-results.json');
  writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
  log(`Results saved to ${resultsPath}`);

  process.exit(exitCode);
}

// Run the tests
runSmokeTests();