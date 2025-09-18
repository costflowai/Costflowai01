#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const contentDir = path.join(rootDir, 'content', 'posts');
const outputPath = path.join(rootDir, 'assets', 'data', 'search.json');

const calculatorsModule = await import(pathToFileURL(path.join(rootDir, 'assets', 'data', 'calculators.meta.js')));
const calculatorsMeta = calculatorsModule.calculatorsMeta || calculatorsModule.default || [];

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
  const calculatorDocs = calculatorsMeta
    .map((item) => ({
      title: item.name,
      url: `/calculators/${item.id}.html`,
      excerpt: item.headline,
      terms: tokenize(`${item.name} ${item.headline} ${item.metaDescription}`)
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
