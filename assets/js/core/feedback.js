import { announce, trapFocus } from './a11y.js';

function hide(element) {
  if (!element) return;
  element.hidden = true;
  element.setAttribute('aria-hidden', 'true');
}

function show(element) {
  if (!element) return;
  element.hidden = false;
  element.setAttribute('aria-hidden', 'false');
}

function serialize(form) {
  const data = new FormData(form);
  return {
    type: data.get('type') || 'Issue',
    rating: data.get('rating') || '',
    message: (data.get('message') || '').trim(),
    email: (data.get('email') || '').trim(),
    page: window.location.pathname,
    userAgent: navigator.userAgent
  };
}

function validatePayload(payload) {
  const errors = [];
  if (!payload.message || payload.message.length < 10) {
    errors.push('Describe the issue or idea in at least 10 characters.');
  }
  if (payload.message.length > 2000) {
    errors.push('Feedback must be 2000 characters or fewer.');
  }
  if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    errors.push('Enter a valid email address or leave the field blank.');
  }
  return errors;
}

function showToast(toast, message) {
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  toast.classList.add('toast--visible');
  announce(toast, message, 'assertive');
  window.setTimeout(() => {
    toast.classList.remove('toast--visible');
    window.setTimeout(() => {
      toast.hidden = true;
      toast.textContent = '';
    }, 250);
  }, 4000);
}

export function initFeedbackWidget() {
  let feedbackRoot = document.querySelector('[data-feedback]');
  if (!feedbackRoot) {
    feedbackRoot = document.createElement('div');
    feedbackRoot.className = 'feedback';
    feedbackRoot.setAttribute('data-feedback', '');
    feedbackRoot.innerHTML = `
      <button type="button" class="button feedback__launcher" data-feedback-toggle aria-haspopup="dialog">
        Share feedback
      </button>
      <div class="feedback__overlay" data-feedback-overlay hidden></div>
      <section
        class="feedback__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-title"
        data-feedback-panel
        hidden
      >
        <header class="feedback__header">
          <h2 id="feedback-title">Help improve CostFlowAI</h2>
          <button type="button" class="feedback__close" data-feedback-close aria-label="Close feedback form">
            &times;
          </button>
        </header>
        <form data-feedback-form novalidate>
          <div class="input-group">
            <label for="feedback-type">What best describes your note?</label>
            <select id="feedback-type" name="type" required>
              <option value="Issue">I found an issue</option>
              <option value="Idea">I have an idea</option>
              <option value="Question">I have a question</option>
              <option value="Praise">I love something</option>
            </select>
          </div>
          <div class="input-group">
            <label for="feedback-rating">Experience rating</label>
            <select id="feedback-rating" name="rating">
              <option value="">Select an option (optional)</option>
              <option value="5">Exceptional</option>
              <option value="4">Great</option>
              <option value="3">Average</option>
              <option value="2">Needs work</option>
              <option value="1">Unusable</option>
            </select>
          </div>
          <div class="input-group">
            <label for="feedback-message">Tell us what happened</label>
            <textarea
              id="feedback-message"
              name="message"
              rows="5"
              minlength="10"
              maxlength="2000"
              required
              aria-describedby="feedback-help"
            ></textarea>
            <p id="feedback-help" class="input-help">
              Include as much detail as you can—calculations, browser, or anything that helps us reproduce the issue.
            </p>
          </div>
          <div class="input-group">
            <label for="feedback-email">Email (optional)</label>
            <input id="feedback-email" type="email" name="email" inputmode="email" autocomplete="email" />
            <p class="input-help">We'll only use this to follow up with you about your submission.</p>
          </div>
          <div class="feedback__actions">
            <button type="submit" class="button" data-feedback-submit>Send feedback</button>
            <button type="button" class="button button--ghost" data-feedback-close-secondary>Cancel</button>
          </div>
          <div class="feedback__status" role="status" aria-live="polite" data-feedback-status></div>
        </form>
      </section>
      <div class="toast" role="status" aria-live="assertive" data-feedback-toast hidden></div>
    `;
    document.body.appendChild(feedbackRoot);
  }
  const toggleBtn = feedbackRoot.querySelector('[data-feedback-toggle]');
  const overlay = feedbackRoot.querySelector('[data-feedback-overlay]');
  const panel = feedbackRoot.querySelector('[data-feedback-panel]');
  const closeBtn = feedbackRoot.querySelector('[data-feedback-close]');
  const closeSecondary = feedbackRoot.querySelector('[data-feedback-close-secondary]');
  const form = feedbackRoot.querySelector('[data-feedback-form]');
  const submitBtn = feedbackRoot.querySelector('[data-feedback-submit]');
  const status = feedbackRoot.querySelector('[data-feedback-status]');
  const toast = feedbackRoot.querySelector('[data-feedback-toast]');

  if (!toggleBtn || !panel || !form) return;

  let lastFocused = null;
  let releaseFocusTrap = null;
  toggleBtn.setAttribute('aria-expanded', 'false');

  function closePanel() {
    hide(panel);
    hide(overlay);
    panel.setAttribute('aria-hidden', 'true');
    toggleBtn.setAttribute('aria-expanded', 'false');
    if (releaseFocusTrap) {
      releaseFocusTrap();
      releaseFocusTrap = null;
    }
    if (lastFocused) {
      lastFocused.focus();
    }
  }

  function openPanel() {
    lastFocused = document.activeElement;
    show(overlay);
    show(panel);
    panel.setAttribute('aria-hidden', 'false');
    toggleBtn.setAttribute('aria-expanded', 'true');
    releaseFocusTrap = trapFocus(panel);
    const firstField = panel.querySelector('select, textarea, input');
    if (firstField) {
      firstField.focus();
    }
  }

  toggleBtn.addEventListener('click', () => {
    if (panel.hidden) {
      openPanel();
    } else {
      closePanel();
    }
  });

  if (overlay) {
    overlay.addEventListener('click', closePanel);
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closePanel);
  }

  if (closeSecondary) {
    closeSecondary.addEventListener('click', closePanel);
  }

  panel.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closePanel();
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    status.textContent = '';
    const payload = serialize(form);
    const errors = validatePayload(payload);
    if (errors.length) {
      status.textContent = errors.join(' ');
      announce(status, status.textContent, 'assertive');
      return;
    }

    submitBtn.disabled = true;
    status.textContent = 'Sending your feedback…';

    try {
      const response = await fetch('/.netlify/functions/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Request failed');
      }

      showToast(toast, 'Thanks! Your feedback reached the CostFlowAI team.');
      status.textContent = '';
      form.reset();
      closePanel();
    } catch (error) {
      console.error('Feedback submission failed', error);
      status.textContent = 'We could not send your note. Please try again in a few minutes.';
      announce(status, status.textContent, 'assertive');
    } finally {
      submitBtn.disabled = false;
    }
  });
}
