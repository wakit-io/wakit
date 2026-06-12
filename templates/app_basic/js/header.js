/**
 * Blog Header Navigation
 * Mobile hamburger menu toggle
 */

(function() {
  'use strict';

  let header, toggle, hamburger, panel, menuItems;
  let isInitialized = false;

  /**
   * Initialize header elements
   */
  function initElements() {
    header = document.querySelector('.blog-header');
    if (!header) return false;

    toggle = header.querySelector('#blog-nav-toggle');
    hamburger = header.querySelector('.blog-header__hamburger');
    panel = header.querySelector('.blog-header__panel');
    menuItems = header.querySelectorAll('.blog-header__menu-item');

    return !!(toggle && hamburger && panel);
  }

  /**
   * Wait until the header is loaded
   */
  function waitForHeader(callback, maxAttempts = 50) {
    let attempts = 0;
    
    function check() {
      attempts++;
      if (initElements()) {
        callback();
      } else if (attempts < maxAttempts) {
        setTimeout(check, 100);
      } else {
        console.warn('Blog header not found after', maxAttempts, 'attempts');
      }
    }
    
    check();
  }

  /**
   * Open menu
   */
  function openMenu() {
    if (!toggle || !hamburger || !panel) return;
    
    toggle.checked = true;
    hamburger.setAttribute('aria-expanded', 'true');
    panel.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    requestAnimationFrame(() => {
      panel.style.maxHeight = panel.scrollHeight + 'px';
    });
  }

  /**
   * Close menu
   */
  function closeMenu() {
    if (!toggle || !hamburger || !panel) return;
    
    toggle.checked = false;
    hamburger.setAttribute('aria-expanded', 'false');
    panel.style.maxHeight = '0';
    document.body.style.overflow = '';
    
    setTimeout(() => {
      if (toggle && !toggle.checked) {
        panel.style.display = 'none';
      }
    }, 300);
  }

  /**
   * Toggle menu
   */
  function toggleMenu() {
    if (!toggle) return;
    
    if (toggle.checked) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  /**
   * Attach event listeners
   */
  function attachEventListeners() {
    if (isInitialized || !toggle || !hamburger || !panel) return;
    isInitialized = true;

    // Hamburger button click event
    hamburger.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      toggleMenu();
    });

    // Checkbox change event
    toggle.addEventListener('change', function() {
      if (this.checked) {
        openMenu();
      } else {
        closeMenu();
      }
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
      if (toggle && toggle.checked && header && !header.contains(e.target)) {
        closeMenu();
      }
    });

    // Close menu with ESC key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && toggle && toggle.checked) {
        closeMenu();
        if (hamburger) hamburger.focus();
      }
    });

    // Close menu when a menu item is clicked (mobile)
    menuItems.forEach(item => {
      item.addEventListener('click', function(e) {
        if (window.innerWidth <= 992) {
          setTimeout(() => {
            closeMenu();
          }, 100);
        }
      });
    });

    // Handle window resize
    let resizeTimer;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function() {
        if (window.innerWidth > 992 && toggle && toggle.checked) {
          closeMenu();
        }
        if (toggle && toggle.checked && panel) {
          panel.style.maxHeight = panel.scrollHeight + 'px';
        }
      }, 250);
    });
  }

  /**
   * Initialize
   */
  function init() {
    if (!panel) return;
    
    if (window.innerWidth <= 992) {
      panel.style.display = 'none';
    }
    
    attachEventListeners();
  }

  /**
   * Main initialization function
   */
  function mainInit() {
    waitForHeader(function() {
      init();
    });
  }

  // Detect header insertion with MutationObserver
  const observer = new MutationObserver(function(mutations) {
    if (!isInitialized && initElements()) {
      init();
    }
  });

  // Initialize when the DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      mainInit();
      // Start observing body
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    });
  } else {
    mainInit();
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Also wait for the window load event (for dynamic loading)
  window.addEventListener('load', function() {
    if (!isInitialized) {
      mainInit();
    }
  });

})();
