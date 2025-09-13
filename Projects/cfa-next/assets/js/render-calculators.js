/**
 * Calculator Renderer - Builds accessible tabs and panels from inventory
 * Handles tab navigation, keyboard interaction, and hash routing
 */

class CalculatorRenderer {
    constructor() {
        this.calculators = [];
        this.activeTab = null;
        this.init();
    }

    async init() {
        try {
            await this.loadInventory();
            this.renderTabs();
            this.renderPanels();
            this.setupTabBehavior();
            this.setupKeyboardNavigation();
            this.handleInitialRoute();
        } catch (error) {
            console.error('Calculator Renderer: Failed to initialize', error);
        }
    }

    async loadInventory() {
        const response = await fetch('/data/calculator-inventory.json');
        if (!response.ok) {
            throw new Error(`Failed to load calculator inventory: ${response.status}`);
        }
        this.calculators = await response.json();
    }

    renderTabs() {
        const tabsContainer = document.getElementById('calc-tabs');
        if (!tabsContainer) return;

        this.calculators.forEach((calc, index) => {
            const button = document.createElement('button');
            button.role = 'tab';
            button.id = `tab-${calc.slug}`;
            button.setAttribute('data-tab', calc.slug);
            button.setAttribute('aria-controls', `${calc.slug}-calc`);
            button.setAttribute('aria-selected', 'false');
            button.setAttribute('tabindex', index === 0 ? '0' : '-1');
            button.textContent = calc.title;

            tabsContainer.appendChild(button);
        });
    }

    renderPanels() {
        const panelsContainer = document.getElementById('calc-panels');
        if (!panelsContainer) return;

        this.calculators.forEach((calc) => {
            const section = document.createElement('section');
            section.id = `${calc.slug}-calc`;
            section.setAttribute('data-calc', calc.slug);
            section.role = 'tabpanel';
            section.setAttribute('aria-labelledby', `tab-${calc.slug}`);
            section.hidden = true;

            section.innerHTML = `
                <header class="calc-header">
                    <h2>${calc.title}</h2>
                </header>
                <div class="inputs">
                    <!-- placeholder only -->
                </div>
                <div class="actions">
                    <button class="btn-primary" data-action="calculate">Calculate</button>
                    <button class="btn" data-action="save" disabled aria-disabled="true">Save</button>
                    <button class="btn" data-action="export" disabled aria-disabled="true">Export CSV</button>
                    <button class="btn" data-action="share" disabled aria-disabled="true">Share</button>
                    <button class="btn" data-action="print" disabled aria-disabled="true">Print</button>
                    <button class="btn" data-action="email" disabled aria-disabled="true">Email</button>
                </div>
            `;

            panelsContainer.appendChild(section);

            // Call per-slug renderer if it exists
            const renderer = this.getSlugRenderer(calc.slug);
            if (renderer) {
                renderer(section);
            }
        });
    }

    getSlugRenderer(slug) {
        const renderers = {
            paint: this.renderPaint.bind(this),
            drywall: this.renderDrywall.bind(this)
        };
        return renderers[slug] || null;
    }

    renderPaint(section) {
        const inputsDiv = section.querySelector('.inputs');
        inputsDiv.innerHTML = `
            <div class="input-row">
                <div class="input-group">
                    <label for="paint-area">Total Area (sq ft) <span class="required">*</span></label>
                    <input type="number" id="paint-area" name="area" step="0.1" min="0" required>
                </div>
                <div class="input-group">
                    <label for="paint-openings">Openings (sq ft)</label>
                    <input type="number" id="paint-openings" name="openings" step="0.1" min="0" value="0">
                </div>
            </div>

            <div class="input-row">
                <div class="input-group">
                    <label for="paint-coats">Number of Coats</label>
                    <input type="number" id="paint-coats" name="coats" step="1" min="1" max="4" value="2">
                </div>
                <div class="input-group">
                    <label for="paint-texture">Surface Texture</label>
                    <select id="paint-texture" name="texture">
                        <option value="smooth">Smooth</option>
                        <option value="medium" selected>Medium</option>
                        <option value="heavy">Heavy</option>
                    </select>
                </div>
            </div>

            <div class="input-row">
                <div class="input-group">
                    <label for="paint-quality">Paint Quality</label>
                    <select id="paint-quality" name="quality">
                        <option value="builder">Builder Grade</option>
                        <option value="standard" selected>Standard</option>
                        <option value="premium">Premium</option>
                    </select>
                </div>
                <div class="input-group checkbox-group">
                    <label for="paint-primer">
                        <input type="checkbox" id="paint-primer" name="primer">
                        Use Primer
                    </label>
                </div>
            </div>

            <div class="input-row">
                <div class="input-group">
                    <label for="paint-coverage">Coverage (sq ft/gal)</label>
                    <input type="number" id="paint-coverage" name="coverage" step="1" min="100" placeholder="Auto">
                </div>
                <div class="input-group">
                    <label for="paint-mat-rate">Material Rate ($/gal)</label>
                    <input type="number" id="paint-mat-rate" name="materialRate" step="0.01" min="0" placeholder="Auto">
                </div>
            </div>

            <div class="input-row">
                <div class="input-group">
                    <label for="paint-labor-rate">Labor Rate ($/hr)</label>
                    <input type="number" id="paint-labor-rate" name="laborRate" step="0.01" min="0" value="55">
                </div>
                <div class="input-group">
                    <label for="paint-productivity">Productivity (sq ft/hr)</label>
                    <input type="number" id="paint-productivity" name="productivity" step="1" min="50" value="250">
                </div>
            </div>
        `;

        // Add results section after actions
        const actionsDiv = section.querySelector('.actions');
        const resultsDiv = document.createElement('div');
        resultsDiv.className = 'results';
        resultsDiv.style.display = 'none';
        resultsDiv.innerHTML = `
            <h3>Results</h3>
            <div class="results-grid">
                <div class="result-group">
                    <h4>Materials</h4>
                    <div class="result-item">
                        <span class="label">Paint Needed:</span>
                        <span id="paint-gallons">0.0 gal</span>
                    </div>
                    <div class="result-item">
                        <span class="label">Primer Needed:</span>
                        <span id="paint-primer-gallons">0.0 gal</span>
                    </div>
                    <div class="result-item">
                        <span class="label">Material Cost:</span>
                        <span id="paint-material">$0.00</span>
                    </div>
                </div>

                <div class="result-group">
                    <h4>Labor</h4>
                    <div class="result-item">
                        <span class="label">Labor Hours:</span>
                        <span id="paint-labor-hours">0.0 hrs</span>
                    </div>
                    <div class="result-item">
                        <span class="label">Labor Cost:</span>
                        <span id="paint-labor">$0.00</span>
                    </div>
                    <div class="result-item total">
                        <span class="label">Total Cost:</span>
                        <span id="paint-total">$0.00</span>
                    </div>
                </div>
            </div>
        `;
        actionsDiv.parentNode.insertBefore(resultsDiv, actionsDiv.nextSibling);
n    renderDrywall(section) {
        const inputsDiv = section.querySelector('.inputs');
        inputsDiv.innerHTML = `
            <div class="input-row">
                <div class="input-group">
                    <label for="dw-wall-area">Wall Area (sq ft) <span class="required">*</span></label>
                    <input type="number" id="dw-wall-area" name="wallArea" step="0.1" min="0" value="800" required>
                </div>
                <div class="input-group">
                    <label for="dw-ceiling-area">Ceiling Area (sq ft)</label>
                    <input type="number" id="dw-ceiling-area" name="ceilingArea" step="0.1" min="0" value="0">
                </div>
            </div>

            <div class="input-row">
                <div class="input-group">
                    <label for="dw-sheet-size">Sheet Size</label>
                    <select id="dw-sheet-size" name="sheetSize">
                        <option value="4x8">4' x 8'</option>
                        <option value="4x12" selected>4' x 12'</option>
                    </select>
                </div>
                <div class="input-group">
                    <label for="dw-waste">Waste Factor (%)</label>
                    <input type="number" id="dw-waste" name="waste" step="1" min="0" max="50" value="10">
                </div>
            </div>

            <div class="input-row">
                <div class="input-group">
                    <label for="dw-level">Finish Level</label>
                    <select id="dw-level" name="level">
                        <option value="L3">Level 3</option>
                        <option value="L4" selected>Level 4</option>
                        <option value="L5">Level 5</option>
                    </select>
                </div>
                <div class="input-group">
                    <label for="dw-sheet-cost">Sheet Cost ($)</label>
                    <input type="number" id="dw-sheet-cost" name="sheetCost" step="0.01" min="0" placeholder="Auto">
                </div>
            </div>

            <div class="input-row">
                <div class="input-group">
                    <label for="dw-mud-rate">Mud Rate ($/sq ft)</label>
                    <input type="number" id="dw-mud-rate" name="mudRate" step="0.01" min="0" value="0.25">
                </div>
                <div class="input-group">
                    <label for="dw-labor-rate">Labor Rate ($/hr)</label>
                    <input type="number" id="dw-labor-rate" name="laborRate" step="0.01" min="0" value="55">
                </div>
            </div>

            <div class="input-row">
                <div class="input-group">
                    <label for="dw-prod-hang">Hanging Productivity (sq ft/hr)</label>
                    <input type="number" id="dw-prod-hang" name="prodHang" step="1" min="1" value="50">
                </div>
                <div class="input-group">
                    <label for="dw-prod-finish">Finishing Productivity (sq ft/hr)</label>
                    <input type="number" id="dw-prod-finish" name="prodFinish" step="1" min="1" value="35">
                </div>
            </div>
        `;

        // Add results section after actions
        const actionsDiv = section.querySelector('.actions');
        const resultsDiv = document.createElement('div');
        resultsDiv.className = 'results';
        resultsDiv.style.display = 'none';
        resultsDiv.innerHTML = `
            <h3>Results</h3>
            <div class="results-grid">
                <div class="result-group">
                    <h4>Materials</h4>
                    <div class="result-item">
                        <span class="label">Sheets Required:</span>
                        <span id="dw-sheets">0</span>
                    </div>
                    <div class="result-item">
                        <span class="label">Material Cost:</span>
                        <span id="dw-material">$0.00</span>
                    </div>
                </div>

                <div class="result-group">
                    <h4>Labor</h4>
                    <div class="result-item">
                        <span class="label">Labor Hours:</span>
                        <span id="dw-labor-hours">0.0 hrs</span>
                    </div>
                    <div class="result-item">
                        <span class="label">Labor Cost:</span>
                        <span id="dw-labor">$0.00</span>
                    </div>
                    <div class="result-item total">
                        <span class="label">Total Cost:</span>
                        <span id="dw-total">$0.00</span>
                    </div>
                </div>
            </div>
        `;
        actionsDiv.parentNode.insertBefore(resultsDiv, actionsDiv.nextSibling);
    }

    setupTabBehavior() {
        const tabsContainer = document.getElementById('calc-tabs');
        if (!tabsContainer) return;

        tabsContainer.addEventListener('click', (event) => {
            if (event.target.role === 'tab') {
                const slug = event.target.getAttribute('data-tab');
                this.selectTab(slug);
            }
        });

        tabsContainer.addEventListener('keydown', (event) => {
            if (event.target.role === 'tab' && (event.key === 'Enter' || event.key === ' ')) {
                event.preventDefault();
                const slug = event.target.getAttribute('data-tab');
                this.selectTab(slug);
            }
        });
    }

    setupKeyboardNavigation() {
        const tabsContainer = document.getElementById('calc-tabs');
        if (!tabsContainer) return;

        tabsContainer.addEventListener('keydown', (event) => {
            if (event.target.role !== 'tab') return;

            const tabs = Array.from(tabsContainer.querySelectorAll('[role="tab"]'));
            const currentIndex = tabs.indexOf(event.target);

            if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                event.preventDefault();
                const nextIndex = (currentIndex + 1) % tabs.length;
                tabs[nextIndex].focus();
            } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                event.preventDefault();
                const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
                tabs[prevIndex].focus();
            }
        });
    }

    selectTab(slug) {
        // Update tab states
        const tabs = document.querySelectorAll('[role="tab"]');
        tabs.forEach(tab => {
            const isSelected = tab.getAttribute('data-tab') === slug;
            tab.setAttribute('aria-selected', isSelected.toString());
            tab.setAttribute('tabindex', isSelected ? '0' : '-1');
        });

        // Show corresponding panel, hide others
        const panels = document.querySelectorAll('[role="tabpanel"]');
        panels.forEach(panel => {
            const shouldShow = panel.getAttribute('data-calc') === slug;
            panel.hidden = !shouldShow;
        });

        this.activeTab = slug;
        this.updateRoute(slug);
    }

    updateRoute(slug) {
        const newUrl = `${window.location.pathname}#${slug}`;
        history.replaceState(null, '', newUrl);
    }

    handleInitialRoute() {
        const hash = location.hash.replace('#', '');
        const targetSlug = this.calculators.find(calc => calc.slug === hash)?.slug || this.calculators[0]?.slug;

        if (targetSlug) {
            this.selectTab(targetSlug);
        }
    }

    // Public method for external access if needed
    getActiveTab() {
        return this.activeTab;
    }

    getCalculators() {
        return [...this.calculators];
    }
}

// Initialize renderer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.calculatorRenderer = new CalculatorRenderer();
});

// Handle hash changes for navigation
window.addEventListener('hashchange', () => {
    if (window.calculatorRenderer) {
        const hash = location.hash.replace('#', '');
        const validSlug = window.calculatorRenderer.getCalculators().find(calc => calc.slug === hash)?.slug;

        if (validSlug) {
            window.calculatorRenderer.selectTab(validSlug);
        }
    }
});