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
        });
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