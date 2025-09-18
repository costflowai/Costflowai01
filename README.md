# CostFlowAI - Construction Cost Calculator

Professional construction cost estimation tool with multiple calculators.

## Features
- Concrete Calculator
- Framing Calculator
- Paint Calculator
- Roofing Calculator
- Electrical Calculator
- HVAC Calculator
- And more...

## Development
- Static HTML/CSS/JS site
- Deployed on Netlify
- Modern ES modules with hashed asset filenames

### Local Setup
1. Install dependencies (used for testing only):
   ```bash
   npm install
   ```
2. Open `src/calculators/index.html` in your browser (no build step required).

### Run Tests
Unit tests validate calculator math using JSDOM:
```bash
npm test
```

### Deployment
```bash
npm run deploy
```
The Netlify configuration adds cache-busting headers and a CSP for production.

## File Structure
- `/src` - All source files
  - `/css` - Stylesheets
  - `/js` - JavaScript files
  - `/images` - Image assets
  - `/assets` - Other assets
  - `/calculators` - Calculator pages
- `/netlify` - Netlify functions and configuration

## Deployment
The site is deployed on Netlify with automatic builds from the main branch.

## Calculator Features
- Real-time calculations
- Export to PDF, CSV
- Formula transparency
- Regional pricing
- Mobile-responsive design

## Tech Stack
- HTML5
- CSS3 (Custom Properties, Grid, Flexbox)
- Vanilla JavaScript (ES6+)
- Netlify (Hosting & Functions)
