import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { access } from 'node:fs/promises';
import { constants } from 'node:fs';

async function fileExists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

test('Concrete Slab Pro page includes live region for a11y', async () => {
  const html = await readFile('calculators/concrete-slab-pro.html', 'utf8');
  assert.ok(html.includes('results-live-region'), 'live region class should exist');
  assert.match(html, /aria-live="polite"/);
});

test('Blog index renders at least one card and link to RSS/Sitemap exists', async () => {
  const html = await readFile('blog/index.html', 'utf8');
  assert.match(html, /card__title/);
  assert.equal(await fileExists('rss.xml'), true, 'rss.xml should exist');
  assert.equal(await fileExists('sitemap.xml'), true, 'sitemap.xml should exist');
});
