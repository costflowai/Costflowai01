import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.csv': 'text/csv',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf'
};

export const startStaticServer = ({ root = 'src', port = 4173 } = {}) => {
  const absoluteRoot = resolve(root);

  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? '/', 'http://localhost');
      let relativePath = url.pathname;

      if (relativePath.endsWith('/')) {
        relativePath = `${relativePath}index.html`;
      }

      const filePath = join(absoluteRoot, relativePath);
      const fileStat = await stat(filePath);

      if (fileStat.isDirectory()) {
        response.writeHead(404);
        response.end('Not found');
        return;
      }

      const data = await readFile(filePath);
      const contentType = mimeTypes[extname(filePath)] ?? 'application/octet-stream';
      response.writeHead(200, { 'Content-Type': contentType });
      response.end(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        response.writeHead(404);
        response.end('Not found');
        return;
      }
      response.writeHead(500);
      response.end('Server error');
    }
  });

  return new Promise((resolvePromise) => {
    server.listen(port, () => {
      resolvePromise({
        port,
        close: () => new Promise((resolveClose) => server.close(() => resolveClose()))
      });
    });
  });
};
