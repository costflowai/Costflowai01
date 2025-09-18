import { readdir } from 'node:fs/promises';
import { join, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const rootDir = fileURLToPath(new URL('..', import.meta.url));
const JS_EXTENSIONS = new Set(['.js', '.mjs']);
const SKIP_DIRECTORIES = new Set(['node_modules', 'vendor', '.git']);

async function collectFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (SKIP_DIRECTORIES.has(entry.name)) {
      continue;
    }
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(fullPath)));
    } else if (JS_EXTENSIONS.has(extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

function runNodeCheck(file) {
  return new Promise((resolve, reject) => {
    const proc = spawn(process.execPath, ['--check', file], { stdio: 'inherit' });
    proc.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Syntax check failed for ${file}`));
      }
    });
  });
}

const files = await collectFiles(rootDir);
for (const file of files) {
  const rel = relative(rootDir, file);
  process.stdout.write(`Checking ${rel}\n`);
  await runNodeCheck(file);
}

console.log(`Checked ${files.length} JavaScript files.`);
