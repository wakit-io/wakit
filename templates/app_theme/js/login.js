/**
 * Login - Password toggle
 * DOMContentLoaded + MutationObserver로 wakit 다이나믹 뷰에서도 동작
 */
(function () {
  'use strict';

  var DATA_INIT = 'data-login-pw-toggle-initialized';

  function initPasswordToggle(root) {
    root = root || document;

    var pages = root.querySelectorAll('.login-page');
    pages.forEach(function (page) {
      var passwordInput = page.querySelector('#password') || page.querySelector('input[name="password"]');
      if (!passwordInput) return;

      var wrapper = passwordInput.closest('.input-wrapper');
      if (!wrapper) return;

      var toggle = wrapper.querySelector('.input-toggle');
      if (!toggle || toggle.getAttribute(DATA_INIT) === '1') return;

      toggle.addEventListener('click', function () {
        var type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);

        var icon = toggle.querySelector('i');
        if (!icon) return;

        if (type === 'text') {
          icon.classList.remove('bi-eye');
          icon.classList.add('bi-eye-slash');
        } else {
          icon.classList.remove('bi-eye-slash');
          icon.classList.add('bi-eye');
        }
      });

      toggle.setAttribute(DATA_INIT, '1');
    });
  }

  function init() {
    initPasswordToggle(document);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  var observer = new MutationObserver(function () {
    init();
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();

