// On-demand feedback widget loader
(function() {
  let feedbackLoaded = false;
  
  // Create minimal feedback button
  const createFeedbackButton = () => {
    const button = document.createElement('button');
    button.id = 'feedback-open';
    button.setAttribute('aria-label', 'Send Feedback');
    button.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      background: linear-gradient(45deg, #667eea, #764ba2);
      color: white;
      border: none;
      border-radius: 25px;
      padding: 12px 16px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
      z-index: 1000;
      transition: all 0.3s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    button.innerHTML = '💬 Feedback';
    
    // Hover effects
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 6px 25px rgba(102, 126, 234, 0.4)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '0 4px 20px rgba(102, 126, 234, 0.3)';
    });
    
    return button;
  };
  
  // Load feedback widget on demand
  const loadFeedbackWidget = async () => {
    if (feedbackLoaded) return;
    
    try {
      // Remove the minimal button
      const tempButton = document.getElementById('feedback-open');
      if (tempButton) tempButton.remove();
      
      // Load the full feedback widget
      const script = document.createElement('script');
      script.src = '/assets/js/feedback-widget.js';
      
      // Add nonce if available
      const meta = document.querySelector('meta[name="csp-nonce"]');
      if (meta) script.setAttribute('nonce', meta.content);
      
      script.onload = () => {
        feedbackLoaded = true;
        // Show the modal immediately if the widget loaded successfully
        if (window.feedbackWidget && window.feedbackWidget.showModal) {
          window.feedbackWidget.showModal();
        }
      };
      
      script.onerror = () => {
        console.warn('Failed to load feedback widget');
        // Restore minimal button on error
        document.body.appendChild(createFeedbackButton());
      };
      
      document.head.appendChild(script);
      
    } catch (error) {
      console.warn('Error loading feedback widget:', error);
      // Restore minimal button on error
      const tempButton = document.getElementById('feedback-open');
      if (!tempButton) {
        document.body.appendChild(createFeedbackButton());
      }
    }
  };
  
  // Initialize when DOM is ready
  const init = () => {
    const button = createFeedbackButton();
    button.addEventListener('click', loadFeedbackWidget);
    document.body.appendChild(button);
  };
  
  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();