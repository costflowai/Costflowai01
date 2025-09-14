/**
 * Link Checker for CostFlowAI
 * Verifies zero broken internal links
 */

import { JSDOM } from 'jsdom';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function getAllHtmlFiles(dir) {
    const files = [];
    const items = await fs.readdir(dir, { withFileTypes: true });
    
    for (const item of items) {
        const fullPath = path.join(dir, item.name);
        
        if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
            files.push(...await getAllHtmlFiles(fullPath));
        } else if (item.isFile() && item.name.endsWith('.html')) {
            files.push(fullPath);
        }
    }
    
    return files;
}

async function extractLinks(filePath) {
    const html = await fs.readFile(filePath, 'utf-8');
    const dom = new JSDOM(html);
    const { document } = dom.window;
    
    const links = new Set();
    
    // Get all links
    document.querySelectorAll('a[href]').forEach(a => {
        const href = a.getAttribute('href');
        if (href && !href.startsWith('http') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
            links.add(href);
        }
    });
    
    // Get all script sources
    document.querySelectorAll('script[src]').forEach(script => {
        const src = script.getAttribute('src');
        if (src && !src.startsWith('http')) {
            links.add(src);
        }
    });
    
    // Get all link hrefs
    document.querySelectorAll('link[href]').forEach(link => {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('http')) {
            links.add(href);
        }
    });
    
    // Get all image sources
    document.querySelectorAll('img[src]').forEach(img => {
        const src = img.getAttribute('src');
        if (src && !src.startsWith('http') && !src.startsWith('data:')) {
            links.add(src);
        }
    });
    
    return Array.from(links);
}

async function checkLink(link, basePath) {
    // Remove hash and query params
    const cleanLink = link.split('#')[0].split('?')[0];
    
    if (!cleanLink) return true; // Hash-only links are ok
    
    // Resolve the path
    let targetPath;
    if (cleanLink.startsWith('/')) {
        targetPath = path.join(process.cwd(), 'src', cleanLink.substring(1));
    } else {
        targetPath = path.resolve(path.dirname(basePath), cleanLink);
    }
    
    try {
        await fs.access(targetPath);
        return true;
    } catch {
        // Try with .html extension
        try {
            await fs.access(targetPath + '.html');
            return true;
        } catch {
            // Try as directory with index.html
            try {
                await fs.access(path.join(targetPath, 'index.html'));
                return true;
            } catch {
                return false;
            }
        }
    }
}

async function runLinkCheck() {
    console.log('🔗 Checking for broken links...\n');
    
    const srcPath = path.join(process.cwd(), 'src');
    const htmlFiles = await getAllHtmlFiles(srcPath);
    
    console.log(`Found ${htmlFiles.length} HTML files to check\n`);
    
    const brokenLinks = [];
    
    for (const file of htmlFiles) {
        const relativePath = path.relative(process.cwd(), file);
        const links = await extractLinks(file);
        
        if (links.length > 0) {
            console.log(`Checking ${relativePath} (${links.length} links)`);
            
            for (const link of links) {
                const isValid = await checkLink(link, file);
                
                if (!isValid) {
                    brokenLinks.push({
                        file: relativePath,
                        link
                    });
                }
            }
        }
    }
    
    if (brokenLinks.length > 0) {
        console.error('\n❌ Found broken links:\n');
        brokenLinks.forEach(({ file, link }) => {
            console.error(`  ${file}: ${link}`);
        });
        process.exit(1);
    } else {
        console.log('\n✅ No broken links found!');
        process.exit(0);
    }
}

runLinkCheck().catch(error => {
    console.error('Error:', error);
    process.exit(1);
});
