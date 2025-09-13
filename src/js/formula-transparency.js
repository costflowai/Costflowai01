/**
 * CostFlowAI Formula Transparency System
 * Shows users the formulas and methodology behind calculations
 */

(function() {
  'use strict';
  
  /**
   * Formula definitions for each calculator type
   */
  const CALCULATOR_FORMULAS = {
    concrete: {
      title: 'Concrete Calculator Formulas',
      description: 'Professional concrete estimation using industry-standard methods',
      formulas: [
        {
          name: 'Concrete Volume (Cubic Yards)',
          formula: 'Volume = (Length × Width × Thickness) ÷ 27',
          explanation: 'Converts cubic feet to cubic yards by dividing by 27',
          example: 'For 20ft × 10ft × 4in: (20 × 10 × 0.33) ÷ 27 = 2.44 CY'
        },
        {
          name: 'Material Cost',
          formula: 'Material Cost = Volume × Unit Price × Waste Factor',
          explanation: 'Includes 5-10% waste factor for typical concrete pours',
          example: '2.44 CY × $120/CY × 1.05 = $307.44'
        },
        {
          name: 'Labor Cost',
          formula: 'Labor Cost = Volume × Labor Rate × Complexity Factor',
          explanation: 'Based on crew productivity rates for concrete placement',
          example: '2.44 CY × $45/CY × 1.2 = $131.76'
        },
        {
          name: 'Reinforcement Requirements',
          formula: 'Rebar = Area × Spacing Factor',
          explanation: 'Based on structural requirements and local codes',
          example: 'Standard #4 rebar at 12" OC for residential slabs'
        }
      ],
      assumptions: [
        'Standard residential-grade concrete (3000-4000 PSI)',
        '5-10% waste factor included in material calculations',
        'Labor rates based on regional averages',
        'Does not include excavation, forms, or finishing',
        'Assumes normal soil conditions and accessibility'
      ],
      methodology: 'Calculations follow ACI (American Concrete Institute) guidelines and industry best practices for residential and light commercial construction.'
    },
    
    framing: {
      title: 'Framing Calculator Formulas',
      description: 'Lumber and labor estimation for wood frame construction',
      formulas: [
        {
          name: 'Stud Count',
          formula: 'Studs = (Length ÷ Spacing) + 1 + Extras',
          explanation: 'Standard 16" or 24" OC spacing plus corners and openings',
          example: 'For 20ft wall at 16" OC: (20 × 12 ÷ 16) + 1 + 2 = 18 studs'
        },
        {
          name: 'Board Feet',
          formula: 'BF = (Length × Width × Thickness) ÷ 144',
          explanation: 'Converts lumber dimensions to board feet pricing unit',
          example: '2×4×8ft stud: (8 × 4 × 2) ÷ 144 = 0.44 BF'
        },
        {
          name: 'Top/Bottom Plates',
          formula: 'Plates = Wall Length × 3 (double top, single bottom)',
          explanation: 'Standard framing requires double top plate and single bottom',
          example: 'For 20ft wall: 20ft × 3 = 60 linear feet of plates'
        },
        {
          name: 'Labor Hours',
          formula: 'Hours = Square Footage ÷ Production Rate',
          explanation: 'Based on experienced framing crew productivity',
          example: '1000 sq ft ÷ 200 sq ft/hour = 5 crew hours'
        }
      ],
      assumptions: [
        'Standard platform framing construction',
        'Douglas Fir or Southern Pine lumber grades',
        '8ft ceiling height assumed unless specified',
        'Normal wall conditions without complex angles',
        '10% waste factor included for lumber'
      ],
      methodology: 'Based on IRC (International Residential Code) requirements and standard construction practices.'
    },
    
    paint: {
      title: 'Paint Calculator Formulas',
      description: 'Coverage and material estimation for interior/exterior painting',
      formulas: [
        {
          name: 'Surface Area',
          formula: 'Area = (Length × Height × 2) + (Width × Height × 2)',
          explanation: 'Calculates total wall area for room perimeter',
          example: '12×15ft room with 9ft ceilings: (12×9×2) + (15×9×2) = 486 sq ft'
        },
        {
          name: 'Paint Coverage',
          formula: 'Gallons = Net Area ÷ Coverage Rate ÷ Coats',
          explanation: 'Standard coverage rate is 350-400 sq ft per gallon',
          example: '486 sq ft ÷ 400 sq ft/gal ÷ 2 coats = 2.4 gallons'
        },
        {
          name: 'Opening Deductions',
          formula: 'Net Area = Gross Area - Doors - Windows',
          explanation: 'Subtracts door (20 sq ft) and window (15 sq ft) areas',
          example: '486 sq ft - 40 sq ft (2 doors) - 30 sq ft (2 windows) = 416 sq ft'
        },
        {
          name: 'Labor Time',
          formula: 'Hours = Area ÷ Coverage Rate per Hour',
          explanation: 'Professional painter productivity rates',
          example: '400 sq ft ÷ 150 sq ft/hour = 2.7 hours'
        }
      ],
      assumptions: [
        'Standard latex paint with primer',
        'Two coats application assumed',
        'Normal surface conditions (no heavy texture)',
        '5% material waste factor included',
        'Professional application methods'
      ],
      methodology: 'Based on PDCA (Painting and Decorating Contractors of America) standards and manufacturer specifications.'
    },
    
    roofing: {
      title: 'Roofing Calculator Formulas',
      description: 'Shingle and labor estimation for sloped roofing',
      formulas: [
        {
          name: 'Roof Area',
          formula: 'Roof Area = Floor Area × Pitch Factor',
          explanation: 'Pitch factor accounts for roof slope (1.0-1.4+ depending on pitch)',
          example: '1200 sq ft house × 1.3 (6/12 pitch) = 1560 sq ft roof area'
        },
        {
          name: 'Roofing Squares',
          formula: 'Squares = Roof Area ÷ 100',
          explanation: 'Roofing materials sold by "square" (100 sq ft)',
          example: '1560 sq ft ÷ 100 = 15.6 squares'
        },
        {
          name: 'Shingle Bundles',
          formula: 'Bundles = Squares × 3',
          explanation: 'Standard architectural shingles: 3 bundles per square',
          example: '15.6 squares × 3 bundles = 47 bundles'
        },
        {
          name: 'Ridge Length',
          formula: 'Ridge = Building Length + Hip/Valley Adjustments',
          explanation: 'Linear feet of ridge cap material needed',
          example: '40ft building length = 40 LF ridge cap'
        }
      ],
      assumptions: [
        'Architectural asphalt shingles',
        '10% waste factor for cuts and mistakes',
        'Standard roof complexity (no excessive cuts)',
        'Includes starter strip and ridge cap',
        'Normal roof access conditions'
      ],
      methodology: 'Follows NRCA (National Roofing Contractors Association) estimation guidelines.'
    },
    
    drywall: {
      title: 'Drywall Calculator Formulas',
      description: 'Drywall material and finishing cost estimation',
      formulas: [
        {
          name: 'Wall Area',
          formula: 'Area = (Perimeter × Height) - Openings',
          explanation: 'Total wall surface area minus doors and windows',
          example: '(60ft perimeter × 9ft) - 60 sq ft openings = 480 sq ft'
        },
        {
          name: 'Sheet Count',
          formula: 'Sheets = Area ÷ Sheet Size',
          explanation: 'Standard 4×8ft sheets = 32 sq ft each',
          example: '480 sq ft ÷ 32 sq ft/sheet = 15 sheets'
        },
        {
          name: 'Joint Compound',
          formula: 'Compound = Area × 0.05 gallons per 100 sq ft',
          explanation: 'Covers taping, second coat, and final coat',
          example: '480 sq ft × 0.05 ÷ 100 = 0.24 gallons'
        },
        {
          name: 'Drywall Tape',
          formula: 'Tape = (Linear Feet of Joints) × 1.1',
          explanation: 'All horizontal and vertical joints plus 10% waste',
          example: '200 LF of joints × 1.1 = 220 feet of tape'
        }
      ],
      assumptions: [
        '½" standard drywall for walls and ceilings',
        'Level 4 finish (primer and paint ready)',
        'Standard framing 16" or 24" OC',
        '5% waste factor included',
        'Normal ceiling height (8-10 feet)'
      ],
      methodology: 'Based on GA (Gypsum Association) standards and industry practices.'
    },
    
    electrical: {
      title: 'Electrical Calculator Formulas',
      description: 'Electrical load and circuit estimation for residential wiring',
      formulas: [
        {
          name: 'General Lighting Load',
          formula: 'Load = Square Footage × 3 watts/sq ft',
          explanation: 'NEC requirement for general lighting circuits',
          example: '2000 sq ft × 3 watts = 6000 watts = 25 amps'
        },
        {
          name: 'Outlet Circuits',
          formula: 'Circuits = Outlets ÷ 10 outlets per circuit',
          explanation: 'Maximum 10 outlets per 20-amp circuit (NEC guideline)',
          example: '25 outlets ÷ 10 = 3 circuits (minimum)'
        },
        {
          name: 'Service Panel Size',
          formula: 'Panel = Total Load × 1.25 (safety factor)',
          explanation: '125% of calculated load per NEC requirements',
          example: '100 amp load × 1.25 = 125 amp minimum service'
        },
        {
          name: 'Wire Length',
          formula: 'Wire = Circuit Length × 2 (supply and return)',
          explanation: 'Includes wire run to outlet and return to panel',
          example: '50ft run × 2 = 100 feet of wire per circuit'
        }
      ],
      assumptions: [
        'Standard residential voltage (120/240V)',
        'Copper wiring (THWN or Romex)',
        'NEC (National Electrical Code) compliance',
        'Normal installation conditions',
        'Does not include permits or inspections'
      ],
      methodology: 'Calculations follow NEC Article 220 for load calculations and standard electrical practices.'
    },
    
    hvac: {
      title: 'HVAC Calculator Formulas',
      description: 'Heating and cooling load calculations for proper system sizing',
      formulas: [
        {
          name: 'Cooling Load (BTU)',
          formula: 'BTU = Area × 25 BTU/sq ft × Climate Factor',
          explanation: 'Base cooling load adjusted for climate zone',
          example: '1500 sq ft × 25 × 1.2 (hot climate) = 45,000 BTU'
        },
        {
          name: 'Tonnage Calculation',
          formula: 'Tons = BTU ÷ 12,000',
          explanation: 'One ton of cooling = 12,000 BTU per hour',
          example: '45,000 BTU ÷ 12,000 = 3.75 tons'
        },
        {
          name: 'Heating Load',
          formula: 'Heating BTU = Area × 30-50 BTU/sq ft',
          explanation: 'Varies by climate zone and insulation levels',
          example: '1500 sq ft × 40 BTU = 60,000 BTU heating'
        },
        {
          name: 'Ductwork Size',
          formula: 'CFM = Area × 1 CFM per sq ft',
          explanation: 'Air circulation requirements',
          example: '1500 sq ft × 1 CFM = 1500 CFM total airflow'
        }
      ],
      assumptions: [
        'Standard insulation levels (R-13 walls, R-30 attic)',
        'Normal ceiling height (8-9 feet)',
        'Typical window area (15% of floor area)',
        'Standard occupancy (2-4 people)',
        'Regional climate adjustments applied'
      ],
      methodology: 'Based on ACCA Manual J load calculation procedures and ASHRAE standards.'
    }
  };
  
  /**
   * Formula Transparency Manager
   */
  class FormulaTransparency {
    constructor() {
      this.modalVisible = false;
      this.currentCalculator = null;
    }
    
    /**
     * Show formula transparency modal for a calculator
     */
    showFormulas(calculatorType) {
      const formulas = CALCULATOR_FORMULAS[calculatorType];
      if (!formulas) {
        console.warn('No formulas defined for calculator:', calculatorType);
        return;
      }
      
      this.currentCalculator = calculatorType;
      this.createModal(formulas);
      this.modalVisible = true;
    }
    
    /**
     * Create and display the formula modal
     */
    createModal(formulas) {
      // Remove existing modal
      const existingModal = document.getElementById('formula-transparency-modal');
      if (existingModal) {
        existingModal.remove();
      }
      
      // Create modal element
      const modal = document.createElement('div');
      modal.id = 'formula-transparency-modal';
      modal.className = 'formula-modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-labelledby', 'formula-modal-title');
      modal.setAttribute('aria-modal', 'true');
      
      modal.innerHTML = `
        <div class="formula-modal-overlay" onclick="window.formulaTransparency.closeModal()"></div>
        <div class="formula-modal-content">
          <div class="formula-modal-header">
            <h2 id="formula-modal-title">${formulas.title}</h2>
            <button class="formula-modal-close" onclick="window.formulaTransparency.closeModal()" aria-label="Close formula details">×</button>
          </div>
          
          <div class="formula-modal-body">
            <div class="formula-description">
              <p>${formulas.description}</p>
            </div>
            
            <div class="formula-sections">
              <div class="formula-section">
                <h3>📐 Calculation Formulas</h3>
                <div class="formula-list">
                  ${formulas.formulas.map(formula => `
                    <div class="formula-item">
                      <h4>${formula.name}</h4>
                      <div class="formula-equation">${formula.formula}</div>
                      <p class="formula-explanation">${formula.explanation}</p>
                      <div class="formula-example">
                        <strong>Example:</strong> ${formula.example}
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
              
              <div class="formula-section">
                <h3>⚙️ Key Assumptions</h3>
                <ul class="assumptions-list">
                  ${formulas.assumptions.map(assumption => `<li>${assumption}</li>`).join('')}
                </ul>
              </div>
              
              <div class="formula-section">
                <h3>📋 Methodology</h3>
                <p class="methodology">${formulas.methodology}</p>
              </div>
              
              <div class="formula-section disclaimer-section">
                <h3>⚠️ Important Disclaimer</h3>
                <p class="disclaimer-text">
                  These calculations provide rough order of magnitude (ROM) estimates for planning purposes only. 
                  Actual costs and requirements vary significantly based on local conditions, material prices, 
                  labor rates, code requirements, and project complexity. Always consult with licensed professionals 
                  for final project specifications and cost estimates. CostFlowAI is not responsible for 
                  construction decisions made based on these calculations.
                </p>
              </div>
            </div>
          </div>
          
          <div class="formula-modal-footer">
            <button class="btn btn-secondary" onclick="window.formulaTransparency.printFormulas()">🖨️ Print Formulas</button>
            <button class="btn btn-primary" onclick="window.formulaTransparency.closeModal()">Close</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      // Focus management
      setTimeout(() => {
        const closeButton = modal.querySelector('.formula-modal-close');
        if (closeButton) closeButton.focus();
      }, 100);
      
      // Keyboard navigation
      modal.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.closeModal();
        }
        
        if (e.key === 'Tab') {
          this.trapFocus(modal, e);
        }
      });
    }
    
    /**
     * Close the formula modal
     */
    closeModal() {
      const modal = document.getElementById('formula-transparency-modal');
      if (modal) {
        modal.style.animation = 'modalFadeOut 0.3s ease';
        setTimeout(() => {
          if (modal.parentNode) {
            modal.remove();
          }
        }, 300);
      }
      
      this.modalVisible = false;
      this.currentCalculator = null;
      
      // Return focus to trigger button if available
      const triggerBtn = document.querySelector('[data-action="show-formulas"]:focus');
      if (triggerBtn) {
        triggerBtn.focus();
      }
    }
    
    /**
     * Print formulas
     */
    printFormulas() {
      const modal = document.getElementById('formula-transparency-modal');
      if (!modal) return;
      
      const content = modal.querySelector('.formula-modal-content').innerHTML;
      const printWindow = window.open('', '_blank');
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Calculator Formulas - CostFlowAI</title>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
            h2, h3, h4 { color: #1e3a5f; }
            .formula-equation { font-family: 'Courier New', monospace; background: #f5f5f5; padding: 8px; margin: 8px 0; border-left: 3px solid #ff6b35; }
            .formula-example { background: #e6f3ff; padding: 8px; margin: 8px 0; border-radius: 4px; }
            .assumptions-list li { margin: 4px 0; }
            .disclaimer-text { background: #fff5f5; border: 1px solid #ff6b35; padding: 15px; border-radius: 4px; }
            @media print { .formula-modal-header, .formula-modal-footer { display: none; } }
          </style>
        </head>
        <body>
          ${content}
        </body>
        </html>
      `);
      
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
    
    /**
     * Trap focus within modal for accessibility
     */
    trapFocus(modal, event) {
      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }
    
    /**
     * Add formula transparency button to calculator
     */
    addFormulaButton(calculatorType) {
      const calculator = document.querySelector(`#${calculatorType}-calc, [data-calc="${calculatorType}"]`);
      if (!calculator) return;
      
      // Check if button already exists
      if (calculator.querySelector('.formula-transparency-btn')) {
        return;
      }
      
      // Find actions container
      let actionsContainer = calculator.querySelector('.actions');
      
      if (!actionsContainer) {
        // Create actions container if it doesn't exist
        actionsContainer = document.createElement('div');
        actionsContainer.className = 'actions';
        
        const resultsSection = calculator.querySelector('.results-section');
        if (resultsSection) {
          resultsSection.appendChild(actionsContainer);
        } else {
          calculator.appendChild(actionsContainer);
        }
      }
      
      // Create formula transparency button
      const formulaBtn = document.createElement('button');
      formulaBtn.className = 'btn btn-secondary formula-transparency-btn';
      formulaBtn.innerHTML = '📐 Show Formulas';
      formulaBtn.title = 'View calculation methods and formulas';
      formulaBtn.setAttribute('data-action', 'show-formulas');
      formulaBtn.setAttribute('data-calculator', calculatorType);
      
      formulaBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.showFormulas(calculatorType);
      });
      
      actionsContainer.appendChild(formulaBtn);
    }
    
    /**
     * Initialize formula transparency for all calculators
     */
    initializeAll() {
      Object.keys(CALCULATOR_FORMULAS).forEach(calculatorType => {
        this.addFormulaButton(calculatorType);
      });
      
      // Add CSS if not already present
      this.addFormulaStyles();
    }
    
    /**
     * Add CSS styles for formula modal
     */
    addFormulaStyles() {
      if (document.getElementById('formula-transparency-styles')) return;
      
      const style = document.createElement('style');
      style.id = 'formula-transparency-styles';
      style.textContent = `
        .formula-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 10002;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: modalFadeIn 0.3s ease;
        }
        
        .formula-modal-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(2px);
        }
        
        .formula-modal-content {
          position: relative;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          max-width: 800px;
          max-height: 90vh;
          width: 90%;
          display: flex;
          flex-direction: column;
          animation: modalSlideIn 0.3s ease;
        }
        
        .formula-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 25px;
          border-bottom: 2px solid #e2e8f0;
          background: linear-gradient(135deg, #1e3a5f, #0f1f33);
          color: white;
          border-radius: 12px 12px 0 0;
        }
        
        .formula-modal-header h2 {
          margin: 0;
          font-size: 1.5rem;
          color: white;
        }
        
        .formula-modal-close {
          background: none;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s ease;
        }
        
        .formula-modal-close:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        
        .formula-modal-body {
          padding: 25px;
          overflow-y: auto;
          flex: 1;
        }
        
        .formula-description {
          margin-bottom: 25px;
          font-size: 1.1rem;
          color: #4a5568;
        }
        
        .formula-section {
          margin-bottom: 30px;
        }
        
        .formula-section h3 {
          color: #1e3a5f;
          font-size: 1.2rem;
          margin-bottom: 15px;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 5px;
        }
        
        .formula-item {
          background: #f7fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
          transition: box-shadow 0.2s ease;
        }
        
        .formula-item:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .formula-item h4 {
          color: #1e3a5f;
          margin: 0 0 10px 0;
          font-size: 1.1rem;
        }
        
        .formula-equation {
          font-family: 'Courier New', monospace;
          background: white;
          border: 2px solid #ff6b35;
          border-radius: 6px;
          padding: 12px;
          margin: 10px 0;
          font-size: 1rem;
          font-weight: bold;
          color: #1e3a5f;
        }
        
        .formula-explanation {
          color: #4a5568;
          margin: 10px 0;
          font-style: italic;
        }
        
        .formula-example {
          background: #e6f3ff;
          border-left: 4px solid #3182ce;
          padding: 12px;
          margin-top: 10px;
          border-radius: 0 6px 6px 0;
        }
        
        .formula-example strong {
          color: #1e3a5f;
        }
        
        .assumptions-list {
          background: #fffbf0;
          border: 1px solid #f6e05e;
          border-radius: 6px;
          padding: 20px;
        }
        
        .assumptions-list li {
          margin: 8px 0;
          color: #744210;
        }
        
        .methodology {
          background: #f0fff4;
          border: 1px solid #68d391;
          border-radius: 6px;
          padding: 15px;
          color: #22543d;
          font-weight: 500;
        }
        
        .disclaimer-section {
          border: 2px solid #ff6b35;
          border-radius: 8px;
          padding: 20px;
          background: #fff5f5;
        }
        
        .disclaimer-text {
          color: #c53030;
          font-weight: 500;
          margin: 0;
          line-height: 1.6;
        }
        
        .formula-modal-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 25px;
          border-top: 2px solid #e2e8f0;
          background: #f7fafc;
          border-radius: 0 0 12px 12px;
        }
        
        .formula-transparency-btn {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          border: none;
        }
        
        .formula-transparency-btn:hover {
          background: linear-gradient(135deg, #5a6fd8, #6a4190);
          transform: translateY(-1px);
        }
        
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes modalFadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        
        @keyframes modalSlideIn {
          from { transform: translateY(-50px) scale(0.95); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        
        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .formula-modal-content {
            width: 95%;
            max-height: 95vh;
          }
          
          .formula-modal-header,
          .formula-modal-body,
          .formula-modal-footer {
            padding: 15px 20px;
          }
          
          .formula-modal-header h2 {
            font-size: 1.3rem;
          }
          
          .formula-equation {
            font-size: 0.9rem;
          }
          
          .formula-modal-footer {
            flex-direction: column;
            gap: 10px;
          }
        }
      `;
      
      document.head.appendChild(style);
    }
  }
  
  // Create global instance
  const formulaTransparency = new FormulaTransparency();
  window.formulaTransparency = formulaTransparency;
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => formulaTransparency.initializeAll(), 500);
    });
  } else {
    setTimeout(() => formulaTransparency.initializeAll(), 500);
  }
  
  console.log('Formula transparency system loaded');
})();