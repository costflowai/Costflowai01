import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const configPath = resolve('.lighthouserc.json');

try {
  const content = await readFile(configPath, 'utf8');
  const config = JSON.parse(content);
  const assertions = config?.ci?.assert?.assertions ?? {};
  const required = {
    'categories:performance': 0.9,
    'categories:accessibility': 0.9,
    'categories:seo': 0.9
  };

  const missing = [];
  Object.entries(required).forEach(([key, minScore]) => {
    const assertion = assertions[key];
    if (!assertion) {
      missing.push(`Missing assertion for ${key}`);
      return;
    }
    const [, options] = assertion;
    const configuredScore = options?.minScore;
    if (typeof configuredScore !== 'number' || configuredScore < minScore) {
      missing.push(`Assertion for ${key} must be ≥ ${minScore}`);
    }
  });

  if (missing.length > 0) {
    console.error('LHCI gate configuration failed:');
    missing.forEach((issue) => console.error(` • ${issue}`));
    process.exitCode = 1;
  } else {
    console.log('LHCI gate configuration verified. Run Lighthouse in CI to evaluate scores.');
  }
} catch (error) {
  console.error('Unable to verify LHCI configuration:', error.message);
  process.exitCode = 1;
}
