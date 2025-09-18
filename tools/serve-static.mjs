#!/usr/bin/env node
import { createServer } from 'node:http';
import { promises as fs } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const rootDir = resolve(__dirname, '..');
const port = Number.parseInt(process.env.PORT || '4173', 10);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8'
};

function normalisePath(urlPath) {
  const safePath = urlPath.split('?')[0].split('#')[0];
  if (safePath.endsWith('/')) {
    return `${safePath}index.html`;
  }
  return safePath;
}

async function readFileSafe(filePath) {
  try {
    const data = await fs.readFile(filePath);
    return data;
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

const server = createServer(async (req, res) => {
  const urlPath = normalisePath(req.url || '/');
  const filePath = join(rootDir, urlPath);
  const extension = extname(filePath).toLowerCase();

  try {
    const file = await readFileSafe(filePath);
    if (!file) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }

    const type = MIME_TYPES[extension] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    res.end(file);
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`Server error: ${error.message}`);
  }
});

server.listen(port, () => {
  console.log(`Static server listening on http://127.0.0.1:${port}`);
});
