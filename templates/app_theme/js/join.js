/**
 * Join - password toggle, agree-all
 * DOMContentLoaded + MutationObserver로 wakit 다이나믹 뷰에서도 동작
 */
(function () {
  'use strict';

  var DATA_TOGGLE_INIT = 'data-join-toggle-initialized';
  var DATA_AGREE_INIT = 'data-join-agree-initialized';

  function setToggleIcon(toggleBtn, type) {
    var icon = toggleBtn ? toggleBtn.querySelector('i') : null;
    if (!icon) return;
    if (type === 'text') {
      icon.classList.remove('bi-eye');
      icon.classList.add('bi-eye-slash');
    } else {
      icon.classList.remove('bi-eye-slash');
      icon.classList.add('bi-eye');
    }
  }

  function initPasswordToggles(page) {
    if (!page) return;

    var wrappers = page.querySelectorAll('.input-wrapper');
    wrappers.forEach(function (wrapper) {
      var input = wrapper.querySelector('input[type="password"], input[type="text"]');
      var toggle = wrapper.querySelector('.input-toggle');
      if (!input || !toggle) return;
      if (toggle.getAttribute(DATA_TOGGLE_INIT) === '1') return;

      toggle.addEventListener('click', function () {
        var nextType = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', nextType);
        setToggleIcon(toggle, nextType);
      });

      // 초기 아이콘 동기화
      setToggleIcon(toggle, input.getAttribute('type') || 'password');
      toggle.setAttribute(DATA_TOGGLE_INIT, '1');
    });
  }

  function initAgreeAll(page) {
    if (!page) return;

    var agreeAll = page.querySelector('#agree-all');
    if (!agreeAll || agreeAll.getAttribute(DATA_AGREE_INIT) === '1') return;

    var individuals = page.querySelectorAll('#agree-age, #agree-terms, #agree-privacy, #agree-marketing');

    function updateAgreeAllFromIndividuals() {
      if (!agreeAll) return;
      var allChecked = true;
      individuals.forEach(function (cb) {
        if (!cb.checked) allChecked = false;
      });
      agreeAll.checked = allChecked;
    }

    agreeAll.addEventListener('change', function () {
      var checked = !!agreeAll.checked;
      individuals.forEach(function (cb) {
        cb.checked = checked;
      });
    });

    individuals.forEach(function (cb) {
      cb.addEventListener('change', updateAgreeAllFromIndividuals);
    });

    // 초기 상태 반영
    updateAgreeAllFromIndividuals();
    agreeAll.setAttribute(DATA_AGREE_INIT, '1');
  }

  function init() {
    document.querySelectorAll('.join-page').forEach(function (page) {
      initPasswordToggles(page);
      initAgreeAll(page);
    });
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

