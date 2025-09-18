# CostFlowAI Static Site

Enterprise-grade static site for CostFlowAI with a calculator-first experience, reusable engine, and explainable exports.

## Project Layout

```
/                Root Netlify deploy
├── assets/      CSS, JS, and data bundles
├── calculators/ Dedicated calculator entry points
├── blog/        Generated blog output (run build:blog)
├── content/     Markdown sources for posts
├── templates/   HTML templates used by build tools
├── tools/       Node scripts for blog, search, and CSP nonce injection
└── vendor/      Locally vendored jsPDF, XLSX, and Lunr equivalents
```

## Commands

- `npm run build:blog` – Build blog pages, RSS, sitemap, and search index.
- `npm run build:nonce` – Inject a unique CSP nonce into every script tag.
- `npm run build` – Run both tasks.
- `npm test` – Execute Playwright smoke tests.
- `npm run lint` – Lint JavaScript sources with ESLint.
- `npm run lh` – Execute Lighthouse CI (threshold ≥90).

## Calculator Engine

Each calculator module exports `init`, `compute`, `explain`, and `export` APIs. The flagship **Concrete Slab Pro** calculator delivers:

- Volume, rebar, labor, and equipment calculations
- Regionalized pricing with override badges
- Explainable math and accessible results
- CSV, XLSX, PDF, and print-ready exports

Additional calculators ship as structured stubs using the same engine, ready for feature build-out.

## Blog Pipeline

Markdown posts with YAML frontmatter are rendered into semantic HTML using `tools/build_blog.mjs`. The build also produces RSS, sitemap, tag archives, and a Lunr-style search index for the homepage search experience.

## Security & Hosting

- Strict Content Security Policy enforced via Netlify headers with build-time nonce injection
- No inline JavaScript (JSON-LD only) and zero third-party CDNs
- Static assets served from `/assets` and `/vendor` with forced 200 redirects

## Testing

Playwright specs validate the Concrete Slab Pro calculator math, accessibility, and export affordances, while Lighthouse CI maintains ≥90 scores for Performance, Accessibility, and SEO.
