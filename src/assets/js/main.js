const initNavigation = () => {
  const menuToggle = document.querySelector('[data-nav-toggle]');
  const menu = document.querySelector('[data-nav-menu]');

  if (!menuToggle || !menu) return;

  menuToggle.addEventListener('click', () => {
    menu.classList.toggle('hidden');
    const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', (!expanded).toString());
  });
};

const setYear = () => {
  const yearEl = document.querySelector('[data-current-year]');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear().toString();
  }
};

window.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  setYear();
});
