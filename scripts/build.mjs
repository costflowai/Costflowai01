import { cp, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const source = resolve('src');
const destination = resolve('dist');

try {
  await rm(destination, { recursive: true, force: true });
  await cp(source, destination, { recursive: true });
  console.log(`Copied ${source} to ${destination}`);
} catch (error) {
  console.error('Build failed:', error);
  process.exitCode = 1;
}
