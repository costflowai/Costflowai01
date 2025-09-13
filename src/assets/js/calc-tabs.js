// Mobile Calculator Tabs - Accessible Implementation
(function() {
  'use strict';
  
  let currentTab = 'concrete'; // default
  
  // Initialize accessible tabs
  function initializeTabs() {
    const tablist = document.getElementById('calc-tabs');
    const tabs = document.querySelectorAll('[role="tab"]');
    const panels = document.querySelectorAll('[role="tabpanel"]');
    
    console.log('initializeTabs - tablist:', !!tablist, 'tabs:', tabs.length, 'panels:', panels.length);
    
    if (!tablist || tabs.length === 0) {
      console.warn('Tab initialization failed - missing elements');
      return;
    }
    
    // Set initial state
    tabs.forEach((tab, index) => {
      const tabId = tab.getAttribute('data-tab');
      const panel = document.getElementById(tabId + '-calc');
      
      if (tabId === currentTab) {
        // Active tab
        tab.setAttribute('aria-selected', 'true');
        tab.classList.add('active');
        if (panel) {
          panel.removeAttribute('hidden');
          panel.setAttribute('aria-hidden', 'false');
          panel.classList.add('active');
        }
      } else {
        // Inactive tabs
        tab.setAttribute('aria-selected', 'false');
        tab.classList.remove('active');
        if (panel) {
          panel.setAttribute('hidden', '');
          panel.setAttribute('aria-hidden', 'true');
          panel.classList.remove('active');
        }
      }
      
      tab.setAttribute('tabindex', tabId === currentTab ? '0' : '-1');
    });
    
    // Event handlers
    tablist.addEventListener('click', handleTabClick);
    tablist.addEventListener('keydown', handleTabKeydown);
  }
  
  function handleTabClick(event) {
    const tab = event.target.closest('[role="tab"]');
    console.log('handleTabClick:', tab ? tab.getAttribute('data-tab') : 'no tab found');
    if (!tab) return;
    
    event.preventDefault();
    switchToTab(tab.getAttribute('data-tab'));
  }
  
  function handleTabKeydown(event) {
    const tab = event.target.closest('[role="tab"]');
    if (!tab) return;
    
    const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
    const currentIndex = tabs.indexOf(tab);
    let targetIndex;
    
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        switchToTab(tab.getAttribute('data-tab'));
        break;
      case 'ArrowRight':
        event.preventDefault();
        targetIndex = (currentIndex + 1) % tabs.length;
        switchToTab(tabs[targetIndex].getAttribute('data-tab'));
        tabs[targetIndex].focus();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        targetIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        switchToTab(tabs[targetIndex].getAttribute('data-tab'));
        tabs[targetIndex].focus();
        break;
      case 'Home':
        event.preventDefault();
        switchToTab(tabs[0].getAttribute('data-tab'));
        tabs[0].focus();
        break;
      case 'End':
        event.preventDefault();
        switchToTab(tabs[tabs.length - 1].getAttribute('data-tab'));
        tabs[tabs.length - 1].focus();
        break;
    }
  }
  
  function switchToTab(tabId) {
    console.log('switchToTab called with:', tabId, 'current:', currentTab);
    if (tabId === currentTab) return; // Already active
    
    const tabs = document.querySelectorAll('[role="tab"]');
    const panels = document.querySelectorAll('[role="tabpanel"]');
    console.log('Found', tabs.length, 'tabs and', panels.length, 'panels');
    
    // Update all tabs and panels
    tabs.forEach(tab => {
      const isActive = tab.getAttribute('data-tab') === tabId;
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
      tab.setAttribute('tabindex', isActive ? '0' : '-1');
      tab.classList.toggle('active', isActive);
    });
    
    panels.forEach(panel => {
      const panelId = panel.id.replace('-calc', '');
      const isVisible = panelId === tabId;
      
      if (isVisible) {
        panel.removeAttribute('hidden');
        panel.setAttribute('aria-hidden', 'false');
        panel.classList.add('active');
      } else {
        panel.setAttribute('hidden', '');
        panel.setAttribute('aria-hidden', 'true');
        panel.classList.remove('active');
      }
    });
    
    currentTab = tabId;
    
    // Update URL hash without scrolling
    history.replaceState(null, null, '/calculators/#' + tabId);
    
    // Announce change to screen readers
    const announcement = document.getElementById('tab-announcement');
    if (announcement) {
      const tabElement = document.querySelector(`[data-tab="${tabId}"]`);
      announcement.textContent = `${tabElement?.textContent || tabId} calculator selected`;
    }
  }
  
  // Handle direct hash navigation
  function handleHashChange() {
    const hash = location.hash.replace('#', '').toLowerCase();
    if (hash && document.querySelector(`[data-tab="${hash}"]`)) {
      switchToTab(hash);
    } else if (hash) {
      // Handle legacy hash formats with -calc suffix
      const cleanHash = hash.replace('-calc', '');
      if (document.querySelector(`[data-tab="${cleanHash}"]`)) {
        // Update URL to clean format
        history.replaceState(null, null, `/calculators/#${cleanHash}`);
        switchToTab(cleanHash);
      } else {
        // Invalid hash - show error toast and redirect to default
        console.warn('Invalid calculator route:', hash);
        if (window.exportUtils && window.exportUtils.showToast) {
          window.exportUtils.showToast(`Calculator "${hash}" not found. Showing concrete calculator instead.`, 'warning');
        }
        history.replaceState(null, null, '/calculators/#concrete');
        switchToTab('concrete');
      }
    }
  }
  
  // Fix overlay conflicts - ensure tabs are not blocked
  function fixOverlayConflicts() {
    const tablist = document.getElementById('calc-tabs');
    if (!tablist) return;
    
    // Find potentially conflicting elements above tabs
    const rect = tablist.getBoundingClientRect();
    const elementsAbove = document.elementsFromPoint(rect.left + rect.width/2, rect.top - 1);
    
    elementsAbove.forEach(el => {
      // Reduce z-index of decorative headers/banners that might overlap
      if (el.classList.contains('header') || el.classList.contains('banner') || 
          el.tagName === 'HEADER' || el.style.position === 'fixed') {
        const computedStyle = window.getComputedStyle(el);
        const currentZIndex = parseInt(computedStyle.zIndex) || 0;
        
        // Only modify if it's higher than needed and decorative
        if (currentZIndex > 100 && !el.querySelector('button, input, select, a')) {
          el.style.pointerEvents = 'none'; // For decorative elements
          el.style.zIndex = '10'; // Lower z-index
        }
      }
    });
    
    // Ensure tablist is accessible
    tablist.style.position = 'relative';
    tablist.style.zIndex = '1000';
    tablist.style.pointerEvents = 'auto';
  }
  
  // Initialize on DOM ready
  function init() {
    // Handle initial hash with legacy format support
    const hash = location.hash.replace('#', '').toLowerCase();
    if (hash && document.querySelector(`[data-tab="${hash}"]`)) {
      currentTab = hash;
    } else if (hash) {
      // Handle legacy hash formats
      const cleanHash = hash.replace('-calc', '');
      if (document.querySelector(`[data-tab="${cleanHash}"]`)) {
        currentTab = cleanHash;
        // Update URL to clean format
        history.replaceState(null, null, `/calculators/#${cleanHash}`);
      }
    }
    
    initializeTabs();
    fixOverlayConflicts();
    
    // Handle browser back/forward
    window.addEventListener('hashchange', handleHashChange);
    
    // Re-fix overlays on resize
    window.addEventListener('resize', () => {
      setTimeout(fixOverlayConflicts, 100);
    });
    
    // Handle page visibility for better performance
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && location.hash) {
        handleHashChange(); // Re-sync if page becomes visible
      }
    });
    
    console.log('Calculator tabs initialized:', currentTab);
  }
  
  // Initialize immediately when ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
