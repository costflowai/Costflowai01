import { bindCalculator } from './core/ui.js';
import { initFeedbackWidget } from './core/feedback.js';
import { calculator as concreteSlab } from './calculators/concrete-slab-pro.js';
import { calculator as framing } from './calculators/framing-takeoff.js';
import { calculator as drywall } from './calculators/drywall-act.js';
import { calculator as paint } from './calculators/paint-coatings.js';
import { calculator as roofing } from './calculators/roofing.js';
import { calculator as flooring } from './calculators/flooring.js';
import { calculator as plumbing } from './calculators/plumbing.js';
import { calculator as electrical } from './calculators/electrical.js';
import { calculator as hvac } from './calculators/hvac.js';
import { calculator as earthwork } from './calculators/earthwork.js';
import { calculator as masonry } from './calculators/masonry.js';
import { calculator as steel } from './calculators/structural-steel.js';
import { calculator as asphalt } from './calculators/asphalt-paving.js';
import { calculator as siteConcrete } from './calculators/site-concrete.js';
import { calculator as doors } from './calculators/doors-windows.js';
import { calculator as insulation } from './calculators/insulation.js';
import { calculator as firestopping } from './calculators/firestopping.js';
import { calculator as waterproofing } from './calculators/waterproofing.js';
import { calculator as demolition } from './calculators/demolition.js';
import { calculator as generalConditions } from './calculators/general-conditions.js';
import { calculator as contingency } from './calculators/contingency-fees.js';

const registry = new Map(
  [
    concreteSlab,
    framing,
    drywall,
    paint,
    roofing,
    flooring,
    plumbing,
    electrical,
    hvac,
    earthwork,
    masonry,
    steel,
    asphalt,
    siteConcrete,
    doors,
    insulation,
    firestopping,
    waterproofing,
    demolition,
    generalConditions,
    contingency
  ].map((calculator) => [calculator.id, calculator])
);

const calculatorCatalog = [
  { id: 'concrete-slab-pro', category: 'Structures', headline: 'Concrete slab, reinforcement, and placement pricing.' },
  { id: 'framing-takeoff', category: 'Shell', headline: 'Wood framing counts for studs, plates, and headers.' },
  { id: 'drywall-act', category: 'Interiors', headline: 'Drywall and acoustical ceilings with joints and finishes.' },
  { id: 'paint-coatings', category: 'Finishes', headline: 'Interior and exterior paint coverage with prep allowances.' },
  { id: 'roofing', category: 'Envelope', headline: 'Steep and low-slope roofing with underlayment and flashing.' },
  { id: 'flooring', category: 'Finishes', headline: 'Tile, resilient, and carpet systems with setting materials.' },
  { id: 'plumbing-fixtures', category: 'MEP', headline: 'Plumbing fixtures, branch piping, and distribution rough-ins.' },
  { id: 'electrical', category: 'MEP', headline: 'Receptacles, lighting, conduit, and service rough-ins.' },
  { id: 'hvac', category: 'MEP', headline: 'HVAC tonnage, ductwork, and air distribution allowances.' },
  { id: 'earthwork', category: 'Civil', headline: 'Cut/fill balancing and trucking cycles.' },
  { id: 'masonry', category: 'Structures', headline: 'CMU and brick walls with reinforcing and grout lifts.' },
  { id: 'structural-steel', category: 'Structures', headline: 'Fabricated steel tonnage and erection resources.' },
  { id: 'asphalt-paving', category: 'Civil', headline: 'Paving lifts, tack, and striping allowances.' },
  { id: 'site-concrete', category: 'Civil', headline: 'Curbs, gutters, flatwork, and forming resources.' },
  { id: 'doors-windows', category: 'Envelope', headline: 'Door and window package counts with hardware.' },
  { id: 'insulation', category: 'Envelope', headline: 'Thermal insulation by R-value and assemblies.' },
  { id: 'firestopping', category: 'Life Safety', headline: 'Penetration firestopping by system and rating.' },
  { id: 'waterproofing', category: 'Envelope', headline: 'Below- and above-grade waterproofing coverage.' },
  { id: 'demolition', category: 'Enabling', headline: 'Selective and structural demolition massing.' },
  { id: 'general-conditions', category: 'Management', headline: 'Supervision, temp utilities, dumpsters, logistics.' },
  { id: 'contingency-fees', category: 'Finance', headline: 'Markup, contingency, and fee modelling.' }
];

async function initSearch() {
  const searchInput = document.querySelector('[data-search]');
  const resultsContainer = document.querySelector('[data-search-results]');
  if (!searchInput || !resultsContainer) return;

  let searchIndex;
  try {
    const response = await fetch('/assets/data/search.json');
    if (!response.ok) throw new Error('Search index unavailable');
    const data = await response.json();
    searchIndex = data;
  } catch (error) {
    console.warn('Search unavailable', error);
    return;
  }

  function renderResults(term) {
    const trimmed = term.trim().toLowerCase();
    if (!trimmed) {
      resultsContainer.innerHTML = '';
      resultsContainer.hidden = true;
      return;
    }
    const matches = (searchIndex.documents || []).filter((doc) =>
      doc.terms.some((token) => token.includes(trimmed))
    );
    if (!matches.length) {
      resultsContainer.innerHTML = '<p>No matches yet. Try another trade.</p>';
      resultsContainer.hidden = false;
      return;
    }
    const items = matches
      .map((match) => `<a class="card" href="${match.url}"><strong>${match.title}</strong><span>${match.excerpt}</span></a>`)
      .join('');
    resultsContainer.innerHTML = items;
    resultsContainer.hidden = false;
  }

  searchInput.addEventListener('input', (event) => {
    renderResults(event.target.value);
  });
}

function renderCalculatorDirectory() {
  const container = document.querySelector('[data-calculator-directory]');
  if (!container) return;
  container.innerHTML = calculatorCatalog
    .map(
      (entry) => `<article class="card"><header class="card__header"><h2 class="card__title">${registry.get(entry.id).name}</h2><span class="card__meta">${entry.category}</span></header><p>${entry.headline}</p><a class="button" href="/calculators/${entry.id}.html">Open calculator</a></article>`
    )
    .join('');
}

function initCalculatorPage() {
  const shell = document.querySelector('[data-calculator-shell]');
  if (!shell) return;
  const calculatorId = shell.getAttribute('data-calculator-id');
  const calculator = registry.get(calculatorId);
  if (!calculator) return;
  bindCalculator(shell, calculator);
}

function initCalculatorLinks() {
  const list = document.querySelector('[data-calculator-list]');
  if (!list) return;
  list.innerHTML = calculatorCatalog
    .map(
      (entry) => `<li><a href="/calculators/${entry.id}.html">${registry.get(entry.id).name}</a><p>${entry.headline}</p></li>`
    )
    .join('');
}

window.addEventListener('DOMContentLoaded', () => {
  initSearch();
  renderCalculatorDirectory();
  initCalculatorLinks();
  initCalculatorPage();
  initFeedbackWidget();
});

export { registry as calculatorRegistry, calculatorCatalog };
