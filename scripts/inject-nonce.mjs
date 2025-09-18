import { randomBytes } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

const SRC_DIR = new URL('../src', import.meta.url).pathname;

const shouldProcess = (file) => extname(file) === '.html';

const walk = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        return walk(path);
      }
      return shouldProcess(entry.name) ? [path] : [];
    })
  );
  return files.flat();
};

const injectNonce = async () => {
  const files = await walk(SRC_DIR);
  const nonce = randomBytes(16).toString('base64');
  await Promise.all(
    files.map(async (file) => {
      const contents = await readFile(file, 'utf8');
      if (!contents.includes('nonce="')) return;
      const updated = contents.replace(/nonce="[^"]*"/g, `nonce="${nonce}"`);
      await writeFile(file, updated, 'utf8');
    })
  );
  return { files, nonce };
};

injectNonce()
  .then(({ files, nonce }) => {
    process.stdout.write(`Injected CSP nonce ${nonce} into ${files.length} HTML files\n`);
  })
  .catch((error) => {
    console.error('Nonce injection failed', error);
    process.exitCode = 1;
  });
