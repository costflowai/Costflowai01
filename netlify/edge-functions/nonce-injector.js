export default async (request, context) => {
  const response = await context.next();
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('text/html')) {
    return response;
  }

  const nonce = crypto.randomUUID().replace(/-/g, '');
  const text = await response.text();
  const updatedHtml = text.replace(/<script\b([^>]*)>/gi, (match, attrs) => {
    if (/\bnonce\s*=/.test(attrs)) {
      return match;
    }
    const trimmed = attrs.trim();
    const space = trimmed.length > 0 ? ` ${trimmed}` : '';
    return `<script nonce="${nonce}"${space}>`;
  });

  const headers = new Headers(response.headers);
  const csp = headers.get('content-security-policy');
  if (csp) {
    headers.set('content-security-policy', csp.replace('{%NONCE%}', nonce));
  } else {
    headers.set(
      'content-security-policy',
      `default-src 'self'; script-src 'self' 'nonce-${nonce}'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'`
    );
  }

  return new Response(updatedHtml, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
};
