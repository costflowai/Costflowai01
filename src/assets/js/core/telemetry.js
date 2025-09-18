/**
 * Lightweight telemetry – posts calculator usage metrics without collecting PII.
 */

export function recordTelemetry(eventName, payload) {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') {
    return;
  }
  const body = JSON.stringify({
    event: eventName,
    ...payload,
    timestamp: Date.now()
  });
  try {
    const endpoint = '/.netlify/functions/telemetry';
    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, body);
    } else {
      fetch(endpoint, { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'application/json' } });
    }
  } catch (error) {
    console.debug('Telemetry failed', error);
  }
}

export default {
  recordTelemetry
};
