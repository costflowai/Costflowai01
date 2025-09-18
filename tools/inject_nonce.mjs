#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const rootDir = path.resolve(process.cwd());

async function walkDir(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['vendor', 'node_modules', '.git'].includes(entry.name)) continue;
      files.push(...(await walkDir(entryPath)));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(entryPath);
    }
  }
  return files;
}

function applyNonce(content, nonce, filePath) {
  const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  return content.replace(scriptRegex, (match, attrs, body) => {
    const hasSrc = /\bsrc=/.test(attrs);
    const isJsonLd = /type="application\/ld\+json"/.test(attrs);
    if (!hasSrc && !isJsonLd && body.trim()) {
      throw new Error(`Inline script found in ${filePath}`);
    }
    let newAttrs = attrs;
    if (/nonce=/.test(attrs)) {
      newAttrs = attrs.replace(/nonce=".*?"/, `nonce="${nonce}"`);
    } else {
      newAttrs = `${attrs} nonce="${nonce}"`;
    }
    return `<script${newAttrs}>${body}</script>`;
  });
}

async function main() {
  const nonce = crypto.randomBytes(16).toString('base64');
  const htmlFiles = await walkDir(rootDir);
  for (const file of htmlFiles) {
    const content = await fs.readFile(file, 'utf8');
    const updated = applyNonce(content, nonce, file);
    await fs.writeFile(file, updated, 'utf8');
  }
  const netlifyPath = path.join(rootDir, 'netlify.toml');
  const netlifyContent = await fs.readFile(netlifyPath, 'utf8');
  const netlifyUpdated = netlifyContent.replace(/nonce-(\{%NONCE%\}|[A-Za-z0-9+/=]+)/g, `nonce-${nonce}`);
  await fs.writeFile(netlifyPath, netlifyUpdated, 'utf8');
  console.log(`Nonce ${nonce} injected.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
