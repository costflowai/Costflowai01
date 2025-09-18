/**
 * Accessibility helpers for focus management and announcements.
 */

let liveRegion;

function ensureLiveRegion() {
  if (typeof document === 'undefined') return null;
  if (liveRegion) return liveRegion;
  liveRegion = document.createElement('div');
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.setAttribute('role', 'status');
  liveRegion.className = 'sr-only';
  document.body.appendChild(liveRegion);
  return liveRegion;
}

export function announce(message) {
  if (typeof document === 'undefined') return;
  const region = ensureLiveRegion();
  if (!region) return;
  region.textContent = '';
  window.requestAnimationFrame(() => {
    region.textContent = message;
  });
}

export function focusErrorSummary(summaryElement) {
  if (!summaryElement) return;
  summaryElement.setAttribute('tabindex', '-1');
  summaryElement.focus();
  summaryElement.addEventListener('blur', () => {
    summaryElement.removeAttribute('tabindex');
  }, { once: true });
}

export default {
  announce,
  focusErrorSummary
};
