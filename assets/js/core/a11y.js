export function announce(element, message) {
  if (!element) return;
  element.textContent = '';
  element.setAttribute('aria-live', 'polite');
  element.textContent = message;
}

export function focusErrorSummary(summary) {
  if (!summary) return;
  summary.setAttribute('tabindex', '-1');
  summary.focus();
  summary.addEventListener('blur', () => summary.removeAttribute('tabindex'), { once: true });
}

export function trapFocus(container) {
  const focusable = container.querySelectorAll(
    'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
  );
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (!first || !last) return () => {};
  function handle(event) {
    if (event.key !== 'Tab') return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
  container.addEventListener('keydown', handle);
  return () => container.removeEventListener('keydown', handle);
}
