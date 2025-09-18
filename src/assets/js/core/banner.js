const STORAGE_KEY = 'costflowai:banner:dismissed';

const bannerShouldShow = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'true';
  } catch (error) {
    console.warn('Unable to read banner preference', error);
    return true;
  }
};

const persistDismissal = () => {
  try {
    localStorage.setItem(STORAGE_KEY, 'true');
  } catch (error) {
    console.warn('Unable to persist banner preference', error);
  }
};

export const initBanner = (root = document) => {
  const banner = root.querySelector('.site-banner');
  if (!banner) return;
  if (!bannerShouldShow()) {
    banner.hidden = true;
    return;
  }
  const dismiss = banner.querySelector('[data-banner-dismiss]');
  dismiss?.addEventListener('click', () => {
    banner.hidden = true;
    persistDismissal();
  });
};

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => initBanner(document));
}

export default { initBanner };
