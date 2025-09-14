import type { Context } from "https://edge.netlify.com";

export default async (request: Request, context: Context) => {
  // Generate a random nonce
  const nonce = crypto.randomUUID();
  
  // Get the response
  const response = await context.next();
  
  // Clone the response to modify headers
  const modifiedResponse = new Response(response.body, response);
  
  // Get existing CSP header
  const csp = modifiedResponse.headers.get('Content-Security-Policy');
  
  if (csp) {
    // Replace nonce placeholder with actual nonce
    const updatedCSP = csp.replace(/{{nonce}}/g, nonce);
    modifiedResponse.headers.set('Content-Security-Policy', updatedCSP);
  }
  
  // Only inject nonce into HTML responses
  const contentType = modifiedResponse.headers.get('content-type');
  if (contentType && contentType.includes('text/html')) {
    // Read the response body
    const html = await modifiedResponse.text();
    
    // Inject nonce into all script tags
    const modifiedHtml = html.replace(
      /<script(?![^>]*\snonce=)/g,
      `<script nonce="${nonce}"`
    );
    
    // Return modified response
    return new Response(modifiedHtml, {
      status: modifiedResponse.status,
      statusText: modifiedResponse.statusText,
      headers: modifiedResponse.headers
    });
  }
  
  return modifiedResponse;
};

export const config = {
  path: "/*"
};
