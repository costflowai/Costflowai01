#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const calculatorsDir = path.join(rootDir, 'calculators');
const templatesDir = path.join(rootDir, 'templates');

const calculatorsModule = await import(pathToFileURL(path.join(rootDir, 'assets', 'data', 'calculators.meta.js')));
const calculatorsMeta = calculatorsModule.calculatorsMeta || calculatorsModule.default || [];

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(value = '') {
  return escapeHtml(value);
}

function fillTemplate(template, values) {
  return template.replace(/{{(\w+)}}/g, (match, key) => {
    return values[key] ?? '';
  });
}

async function buildStubCalculator(meta, baseTemplate, stubTemplate, year) {
  const calculatorContent = fillTemplate(stubTemplate, {
    calculatorId: meta.id,
    calculatorName: escapeHtml(meta.name),
    calculatorDescription: escapeHtml(meta.stubDescription || meta.headline || '')
  });

  const jsonLd = JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: `${meta.name} Calculator`,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Any',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description: meta.metaDescription
    },
    null,
    2
  );

  const pageHtml = fillTemplate(baseTemplate, {
    title: `${meta.name} Calculator | CostFlowAI`,
    description: escapeAttr(meta.metaDescription || meta.headline || ''),
    canonical: `https://costflow.ai/calculators/${meta.id}.html`,
    jsonld: jsonLd,
    page: 'calculator',
    mainModifier: '',
    year: String(year),
    content: calculatorContent
  });

  const outputPath = path.join(calculatorsDir, `${meta.id}.html`);
  await fs.writeFile(outputPath, pageHtml, 'utf8');
}

async function build() {
  const baseTemplate = await fs.readFile(path.join(templatesDir, 'base.html'), 'utf8');
  const stubTemplate = await fs.readFile(path.join(templatesDir, 'calc_page.html'), 'utf8');
  const year = new Date().getFullYear();

  for (const meta of calculatorsMeta) {
    if (meta.type === 'flagship') continue;
    await buildStubCalculator(meta, baseTemplate, stubTemplate, year);
  }

  console.log(`Built ${calculatorsMeta.filter((meta) => meta.type !== 'flagship').length} stub calculator page(s).`);
}

build().catch((error) => {
  console.error(error);
  process.exit(1);
});
