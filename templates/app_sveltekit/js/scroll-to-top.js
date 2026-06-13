/**
 * Scroll to Top Button
 * Button that scrolls to the top of the page
 */

(function() {
  'use strict';

  const SCROLL_THRESHOLD = 300; // Scroll position at which the button appears (px)
  let scrollButton = null;
  let isInitialized = false;

  /**
   * Find the scroll button element
   */
  function findScrollButton() {
    scrollButton = document.getElementById('scroll-to-top');
    return !!scrollButton;
  }

  /**
   * Wait until the scroll button is loaded
   */
  function waitForButton(callback, maxAttempts = 50) {
    let attempts = 0;
    
    function check() {
      attempts++;
      if (findScrollButton()) {
        callback();
      } else if (attempts < maxAttempts) {
        setTimeout(check, 100);
      }
    }
    
    check();
  }

  /**
   * Toggle button visibility
   */
  function toggleButtonVisibility() {
    if (!scrollButton) return;
    
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    
    if (scrollY > SCROLL_THRESHOLD) {
      scrollButton.classList.add('is-visible');
    } else {
      scrollButton.classList.remove('is-visible');
    }
  }

  /**
   * Scroll to the top of the page
   */
  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  /**
   * Attach event listeners
   */
  function attachEventListeners() {
    if (isInitialized || !scrollButton) return;
    isInitialized = true;

    // Button click event
    scrollButton.addEventListener('click', function(e) {
      e.preventDefault();
      scrollToTop();
    });

    // Scroll event (throttled)
    let ticking = false;
    window.addEventListener('scroll', function() {
      if (!ticking) {
        window.requestAnimationFrame(function() {
          toggleButtonVisibility();
          ticking = false;
        });
        ticking = true;
      }
    });

    // Check initial state
    toggleButtonVisibility();
  }

  /**
   * Initialize
   */
  function init() {
    if (!scrollButton) return;
    attachEventListeners();
  }

  /**
   * Main initialization function
   */
  function mainInit() {
    waitForButton(function() {
      init();
    });
  }

  // Detect button insertion with MutationObserver
  const observer = new MutationObserver(function(mutations) {
    if (!isInitialized && findScrollButton()) {
      init();
    }
  });

  // Initialize when the DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      mainInit();
      // Start observing body
      if (document.body) {
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
      }
    });
  } else {
    mainInit();
    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }

  // Also wait for the window load event (for dynamic loading)
  window.addEventListener('load', function() {
    if (!isInitialized) {
      mainInit();
    }
  });

})();
