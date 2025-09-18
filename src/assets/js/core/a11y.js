const focusElement = (el) => {
  if (!el) return;
  requestAnimationFrame(() => {
    el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: false });
    el.addEventListener(
      'blur',
      () => {
        el.removeAttribute('tabindex');
      },
      { once: true }
    );
  });
};

export const announce = (region, message) => {
  if (!region) return;
  region.textContent = '';
  region.setAttribute('aria-busy', 'true');
  requestAnimationFrame(() => {
    region.textContent = message;
    region.setAttribute('aria-busy', 'false');
  });
};

export const trapFocus = (container) => {
  const focusable = container?.querySelectorAll(
    'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (!focusable?.length) return () => {};
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const handler = (event) => {
    if (event.key !== 'Tab') return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };
  container.addEventListener('keydown', handler);
  return () => container.removeEventListener('keydown', handler);
};

export const setInitialFocus = (element) => focusElement(element);

export default {
  announce,
  trapFocus,
  setInitialFocus
};
