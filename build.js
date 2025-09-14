/**
 * Build script for production deployment
 * Minifies assets and prepares for deployment
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

async function build() {
    console.log('🚀 Starting production build...\n');
    
    try {
        // Create build info
        const buildInfo = {
            version: require('./package.json').version,
            buildTime: new Date().toISOString(),
            buildNumber: crypto.randomBytes(4).toString('hex'),
            environment: 'production'
        };
        
        // Write build info
        await fs.writeFile(
            path.join(__dirname, 'src', 'build-info.json'),
            JSON.stringify(buildInfo, null, 2)
        );
        
        console.log('✅ Build info created');
        console.log(`   Version: ${buildInfo.version}`);
        console.log(`   Build: ${buildInfo.buildNumber}`);
        console.log(`   Time: ${buildInfo.buildTime}\n`);
        
        // Create _headers file for Netlify
        const headers = `/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()

/*.js
  Cache-Control: public, max-age=31536000, immutable

/*.css
  Cache-Control: public, max-age=31536000, immutable

/*.jpg
  Cache-Control: public, max-age=31536000, immutable

/*.png
  Cache-Control: public, max-age=31536000, immutable

/*.svg
  Cache-Control: public, max-age=31536000, immutable

/*.woff2
  Cache-Control: public, max-age=31536000, immutable

/index.html
  Cache-Control: public, max-age=0, must-revalidate`;
        
        await fs.writeFile(path.join(__dirname, 'src', '_headers'), headers);
        console.log('✅ Security headers configured\n');
        
        // Create _redirects file for Netlify
        const redirects = `# Redirects for Netlify
/home              /                    301
/calculators       /                    301
/calc/*            /calculators/:splat  301`;
        
        await fs.writeFile(path.join(__dirname, 'src', '_redirects'), redirects);
        console.log('✅ Redirects configured\n');
        
        console.log('🎉 Build completed successfully!\n');
        console.log('📦 Ready for deployment to Netlify\n');
        
    } catch (error) {
        console.error('❌ Build failed:', error);
        process.exit(1);
    }
}

// Run build
build();
