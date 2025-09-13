import type { Context } from "https://edge.netlify.com";

export default async (request: Request, context: Context) => {
  const response = await context.next();
  
  // Only process HTML responses
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) {
    return response;
  }

  // Generate a random nonce
  const nonce = crypto.randomUUID().replace(/-/g, '');
  
  // Build CSP header with proper directives (NO referrer-policy inside CSP)
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'strict-dynamic' 'nonce-${nonce}' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com`,
    "connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://www.googletagmanager.com",
    "img-src 'self' data: https:",
    "style-src 'self' 'unsafe-inline'",
    "worker-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "upgrade-insecure-requests"
  ].join('; ');

  // Read the HTML content
  let html = await response.text();
  
  // Inject CSP nonce meta tag in head
  const metaTag = `<meta name="csp-nonce" content="${nonce}">`;
  html = html.replace('<head>', `<head>\n    ${metaTag}`);
  
  // Add nonce to all script tags
  html = html.replace(/<script(?![^>]*nonce=)([^>]*)>/g, `<script nonce="${nonce}"$1>`);
  
  // Create new response with CSP headers
  const newResponse = new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers: new Headers(response.headers)
  });
  
  // Set CSP and separate Referrer-Policy header
  newResponse.headers.set('Content-Security-Policy', csp);
  newResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Delete content-length header after HTML mutation
  newResponse.headers.delete('Content-Length');
  
  return newResponse;
};
