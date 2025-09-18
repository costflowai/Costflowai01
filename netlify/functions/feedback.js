import crypto from 'node:crypto';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

function requiredConfig() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const sheetName = process.env.GOOGLE_SHEETS_TAB_NAME || 'Feedback';

  if (!email || !key || !spreadsheetId) {
    throw new Error('Google Sheets credentials are not fully configured.');
  }

  return {
    email,
    privateKey: key.replace(/\\n/g, '\n'),
    spreadsheetId,
    sheetName
  };
}

function createJwt({ email, privateKey }) {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(
    JSON.stringify({
      iss: email,
      scope: GOOGLE_SCOPE,
      aud: GOOGLE_TOKEN_URL,
      iat: now,
      exp: now + 3600
    })
  ).toString('base64url');
  const unsigned = `${header}.${payload}`;
  const signature = crypto.createSign('RSA-SHA256').update(unsigned).sign(privateKey, 'base64url');
  return `${unsigned}.${signature}`;
}

async function fetchAccessToken(config) {
  const assertion = createJwt(config);
  const params = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion
  });
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Google auth failed: ${detail}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function appendFeedback(config, values) {
  const token = await fetchAccessToken(config);
  const range = encodeURIComponent(`${config.sheetName}!A1`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`;
  const body = {
    values: [values]
  };
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Failed to append feedback: ${detail}`);
  }
}

function sanitizeInput(value = '') {
  return String(value).replace(/[\t\r\n]+/g, ' ').trim();
}

export async function handler(event) {
  if (event.httpMethod && event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  if (!event.body) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing request body' })
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch (error) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid JSON payload' })
    };
  }

  const message = sanitizeInput(payload.message);
  if (!message || message.length < 10) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Feedback message is required.' })
    };
  }

  if (message.length > 2000) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Feedback message exceeds 2000 characters.' })
    };
  }

  const email = sanitizeInput(payload.email);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Enter a valid email address or leave blank.' })
    };
  }

  const type = sanitizeInput(payload.type) || 'Issue';
  const rating = sanitizeInput(payload.rating);
  const page = sanitizeInput(payload.page || event.headers?.referer || '');
  const userAgent = sanitizeInput(payload.userAgent || event.headers?.['user-agent'] || '');
  const timestamp = new Date().toISOString();

  let config;
  try {
    config = requiredConfig();
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Feedback service is not configured.' })
    };
  }

  try {
    await appendFeedback(config, [timestamp, type, rating, message, email, page, userAgent]);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true })
    };
  } catch (error) {
    console.error('Feedback submission error', error);
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Unable to record feedback at this time.' })
    };
  }
}

export default handler;
