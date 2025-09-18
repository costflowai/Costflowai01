import test from 'node:test';
import assert from 'node:assert/strict';
import { handler } from '../netlify/functions/feedback.js';

test('feedback function rejects unsupported methods', async () => {
  const response = await handler({ httpMethod: 'GET' });
  assert.equal(response.statusCode, 405);
});

test('feedback function enforces message validation', async () => {
  const response = await handler({ httpMethod: 'POST', body: JSON.stringify({ message: 'short' }) });
  assert.equal(response.statusCode, 400);
  assert.match(response.body, /Feedback message is required/);
});

test('feedback function returns configuration error when Google creds missing', async () => {
  const originalEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const originalKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  const originalSheet = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

  delete process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  delete process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  delete process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

  const body = JSON.stringify({ message: 'This is a valid message for testing the feedback pipeline.' });
  const response = await handler({ httpMethod: 'POST', body });
  assert.equal(response.statusCode, 500);
  assert.match(response.body, /not configured/);

  if (originalEmail !== undefined) {
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = originalEmail;
  }
  if (originalKey !== undefined) {
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY = originalKey;
  }
  if (originalSheet !== undefined) {
    process.env.GOOGLE_SHEETS_SPREADSHEET_ID = originalSheet;
  }
});
