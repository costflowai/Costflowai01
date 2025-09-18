import { bindCalculator } from './core/ui.js';
import { initFeedbackWidget } from './core/feedback.js';
import { calculatorsMeta } from '../data/calculators.meta.js';
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

const calculatorsById = new Map([
  ['concrete-slab-pro', concreteSlab],
  ['framing-takeoff', framing],
  ['drywall-act', drywall],
  ['paint-coatings', paint],
  ['roofing', roofing],
  ['flooring', flooring],
  ['plumbing-fixtures', plumbing],
  ['electrical', electrical],
  ['hvac', hvac],
  ['earthwork', earthwork],
  ['masonry', masonry],
  ['structural-steel', steel],
  ['asphalt-paving', asphalt],
  ['site-concrete', siteConcrete],
  ['doors-windows', doors],
  ['insulation', insulation],
  ['firestopping', firestopping],
  ['waterproofing', waterproofing],
  ['demolition', demolition],
  ['general-conditions', generalConditions],
  ['contingency-fees', contingency]
]);

const registry = new Map();

for (const meta of calculatorsMeta) {
  const calculator = calculatorsById.get(meta.id);
  if (calculator) {
    registry.set(meta.id, calculator);
  }
}

const calculatorCatalog = calculatorsMeta
  .filter((meta) => calculatorsById.has(meta.id))
  .map(({ id, category, headline }) => ({ id, category, headline }));

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
    .map((entry) => {
      const calculator = registry.get(entry.id);
      if (!calculator) return '';
      return `<article class="card"><header class="card__header"><h2 class="card__title">${calculator.name}</h2><span class="card__meta">${entry.category}</span></header><p>${entry.headline}</p><a class="button" href="/calculators/${entry.id}.html">Open calculator</a></article>`;
    })
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
    .map((entry) => {
      const calculator = registry.get(entry.id);
      if (!calculator) return '';
      return `<li><a href="/calculators/${entry.id}.html">${calculator.name}</a><p>${entry.headline}</p></li>`;
    })
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
