import type { Context } from "https://edge.netlify.com";

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  
  const protectedRoutes = ['/owner', '/admin', '/dashboard', '/studio'];
  const isProtectedRoute = protectedRoutes.some(route => url.pathname.startsWith(route));
  
  if (!isProtectedRoute) return;
  
  // EMERGENCY: Always block access - return 404 immediately
  return new Response('<!DOCTYPE html><html><body><h1>404 - Page Not Found</h1><p><a href="/">← Back to Home</a></p></body></html>', {
    status: 404,
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Robots-Tag': 'noindex, noarchive, noimageindex',
      'X-Frame-Options': 'DENY'
    }
  });
};

export const config = { path: ["/(owner|admin|dashboard|studio)/*"] };
