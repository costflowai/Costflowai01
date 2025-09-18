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
- `npm test` – Run Node-based smoke tests for calculators, site output, and functions.
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

Node test coverage validates the Concrete Slab Pro calculator math, static site outputs, and the feedback service contract, while Lighthouse CI maintains ≥90 scores for Performance, Accessibility, and SEO.

## Feedback Capture

Use the floating “Share feedback” button on any page to open the accessible modal form. Submissions post to a Netlify serverless function that appends rows to a Google Sheet owned by `costflowai@gmail.com`.

Provision a Google Cloud service account with Sheets access and configure these environment variables for the Netlify site (or your local dev shell before invoking the function directly):

```
GOOGLE_SERVICE_ACCOUNT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n…\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_SPREADSHEET_ID=your-sheet-id
GOOGLE_SHEETS_TAB_NAME=Feedback   # optional, defaults to “Feedback”
```

The function trims inputs, enforces length and email validation, and writes timestamped records with user agent and page context so the CostFlowAI team can triage issues rapidly.
