#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const contentDir = path.join(rootDir, 'content', 'posts');
const outputPath = path.join(rootDir, 'assets', 'data', 'search.json');

const calculators = [
  { id: 'concrete-slab-pro', title: 'Concrete Slab Pro', excerpt: 'Structural slab volumes, rebar, labor, and equipment ROMs.', url: '/calculators/concrete-slab-pro.html' },
  { id: 'framing-takeoff', title: 'Framing Takeoff', excerpt: 'Studs, plates, and headers for wood framing packages.', url: '/calculators/framing-takeoff.html' },
  { id: 'drywall-act', title: 'Drywall & ACT', excerpt: 'Gypsum board, finishing, and acoustical ceiling tile coverage.', url: '/calculators/drywall-act.html' },
  { id: 'paint-coatings', title: 'Paint & Coatings', excerpt: 'Interior and exterior paint with substrate prep and coats.', url: '/calculators/paint-coatings.html' },
  { id: 'roofing', title: 'Roofing Systems', excerpt: 'Steep and flat roofing with underlayment and flashing.', url: '/calculators/roofing.html' },
  { id: 'flooring', title: 'Flooring Takeoff', excerpt: 'Tile, resilient, and carpet flooring takeoffs.', url: '/calculators/flooring.html' },
  { id: 'plumbing-fixtures', title: 'Plumbing Fixtures & Piping', excerpt: 'Fixtures, carriers, and distribution piping.', url: '/calculators/plumbing-fixtures.html' },
  { id: 'electrical', title: 'Electrical Distribution', excerpt: 'Circuits, receptacles, lighting, and conduit allowances.', url: '/calculators/electrical.html' },
  { id: 'hvac', title: 'HVAC ROM', excerpt: 'HVAC tonnage, ductwork, and air distribution planning.', url: '/calculators/hvac.html' },
  { id: 'earthwork', title: 'Earthwork Cut/Fill', excerpt: 'Cut/fill balancing and truck cycle allowances.', url: '/calculators/earthwork.html' },
  { id: 'masonry', title: 'Masonry Systems', excerpt: 'CMU, brick, and reinforcing takeoffs.', url: '/calculators/masonry.html' },
  { id: 'structural-steel', title: 'Structural Steel', excerpt: 'Fabricated steel tonnage and erection resources.', url: '/calculators/structural-steel.html' },
  { id: 'asphalt-paving', title: 'Asphalt Paving', excerpt: 'Asphalt lifts, tack coat, and striping allowances.', url: '/calculators/asphalt-paving.html' },
  { id: 'site-concrete', title: 'Site Concrete', excerpt: 'Curbs, gutters, and sidewalk pours.', url: '/calculators/site-concrete.html' },
  { id: 'doors-windows', title: 'Doors & Windows', excerpt: 'Openings, glazing, and hardware counts.', url: '/calculators/doors-windows.html' },
  { id: 'insulation', title: 'Insulation Systems', excerpt: 'Batt, board, and blown-in insulation planning.', url: '/calculators/insulation.html' },
  { id: 'firestopping', title: 'Firestopping', excerpt: 'Penetration firestopping system allowances.', url: '/calculators/firestopping.html' },
  { id: 'waterproofing', title: 'Waterproofing', excerpt: 'Below and above grade waterproofing coverage.', url: '/calculators/waterproofing.html' },
  { id: 'demolition', title: 'Demolition', excerpt: 'Selective and structural demolition planning.', url: '/calculators/demolition.html' },
  { id: 'general-conditions', title: 'General Conditions', excerpt: 'Crew, supervision, and project support allowances.', url: '/calculators/general-conditions.html' },
  { id: 'contingency-fees', title: 'Contingency & Fees', excerpt: 'Markup, contingency, and fee modelling.', url: '/calculators/contingency-fees.html' }
];

function tokenize(text) {
  return Array.from(new Set(String(text).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)));
}

async function readPosts() {
  const documents = [];
  try {
    const files = await fs.readdir(contentDir);
    for (const file of files) {
      if (!file.endsWith('.md')) continue;
      const raw = await fs.readFile(path.join(contentDir, file), 'utf8');
      const match = /^---\n([\s\S]+?)\n---\n([\s\S]*)$/m.exec(raw.trim());
      if (!match) continue;
      const metaLines = match[1].split('\n');
      const meta = {};
      for (const line of metaLines) {
        const [key, ...rest] = line.split(':');
        meta[key.trim()] = rest.join(':').trim();
      }
      const slug = meta.slug || file.replace(/\.md$/, '');
      const body = match[2].trim();
      documents.push({
        title: meta.title,
        url: `/blog/${slug}.html`,
        excerpt: body.split('\n').find((line) => line.trim().length) || meta.description || '',
        terms: tokenize(`${meta.title} ${meta.description} ${body}`)
      });
    }
  } catch (error) {
    console.warn('No blog posts found', error.message);
  }
  return documents;
}

async function build() {
  const blogDocs = await readPosts();
  const calculatorDocs = calculators.map((item) => ({
    title: item.title,
    url: item.url,
    excerpt: item.excerpt,
    terms: tokenize(`${item.title} ${item.excerpt}`)
  }));

  const documents = [...calculatorDocs, ...blogDocs];
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify({ documents }, null, 2), 'utf8');
  console.log(`Search index created with ${documents.length} document(s).`);
}

build().catch((error) => {
  console.error(error);
  process.exit(1);
});
