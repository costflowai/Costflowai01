const STORAGE_KEY = 'costflowai.preferences';

function readStorage() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.warn('Storage read failed', error);
    return {};
  }
}

function writeStorage(data) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Storage write failed', error);
  }
}

const cache = readStorage();

export function getPreference(key, fallback = null) {
  return cache[key] ?? fallback;
}

export function setPreference(key, value) {
  cache[key] = value;
  writeStorage(cache);
}

export function rememberInputs(calculatorId, values) {
  const history = cache.history ?? {};
  history[calculatorId] = values;
  cache.history = history;
  writeStorage(cache);
}

export function recallInputs(calculatorId, fallback = {}) {
  return cache.history?.[calculatorId] ?? fallback;
}
