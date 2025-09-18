import { createReadStream } from 'node:fs';
import { stat, readdir } from 'node:fs/promises';
import http from 'node:http';
import { extname, join, resolve } from 'node:path';

const ROOT = resolve('src');
const PORT = process.env.PORT || 4173;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf'
};

const send = (res, status, headers = {}, stream) => {
  res.writeHead(status, headers);
  if (stream) {
    stream.pipe(res);
  } else {
    res.end();
  }
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname.endsWith('/')) {
      pathname += 'index.html';
    }
    const filePath = join(ROOT, pathname);
    const fileStat = await stat(filePath);
    if (fileStat.isDirectory()) {
      const items = await readdir(filePath);
      if (items.includes('index.html')) {
        const stream = createReadStream(join(filePath, 'index.html'));
        return send(res, 200, { 'Content-Type': MIME['.html'] }, stream);
      }
      return send(res, 403);
    }
    const ext = extname(filePath);
    const contentType = MIME[ext] || 'application/octet-stream';
    const stream = createReadStream(filePath);
    return send(res, 200, { 'Content-Type': contentType }, stream);
  } catch (error) {
    const notFound = join(ROOT, 'index.html');
    try {
      const stream = createReadStream(notFound);
      return send(res, 200, { 'Content-Type': MIME['.html'] }, stream);
    } catch (innerError) {
      return send(res, 404, {}, null);
    }
  }
});

server.listen(PORT, () => {
  process.stdout.write(`Static server running at http://localhost:${PORT}\n`);
});
