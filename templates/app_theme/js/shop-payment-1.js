/**
 * Shop Payment 1
 * 결제하기 버튼: 페이지 데이터 수집 → 서버 비동기 호출(선택) → 해시로 shop-payment-2 이동 (wakit 흐름 유지)
 */

(function() {
  'use strict';

  var NEXT_HASH = 'views/shop-payment-2.html';
  var ATTR_INIT = 'data-shop-payment-1-pay-initialized';

  /**
   * 컨테이너 내 input/select/textarea 중 name이 있는 값만 plain object로 반환
   */
  function collectFormLikeData(container) {
    if (!container) return {};
    var obj = {};
    var fields = container.querySelectorAll('input[name], select[name], textarea[name]');
    for (var i = 0; i < fields.length; i++) {
      var el = fields[i];
      var name = el.getAttribute('name');
      if (!name) continue;
      if (el.type === 'checkbox' || el.type === 'radio') {
        if (el.checked) obj[name] = el.value !== undefined ? el.value : 'on';
      } else {
        obj[name] = el.value;
      }
    }
    return obj;
  }

  function initPayButton() {
    var main = document.querySelector('.shop-payment-1');
    if (!main || main.getAttribute(ATTR_INIT) === '1') return;
    var btn = main.querySelector('.payment-summary__btn--primary');
    if (!btn) return;

    btn.addEventListener('click', function(e) {
      e.preventDefault();
      var data = collectFormLikeData(main);
      var query = Object.keys(data).filter(function(k) { return data[k]; }).map(function(k) {
        return encodeURIComponent(k) + '=' + encodeURIComponent(data[k]);
      }).join('&');
      var hashTarget = NEXT_HASH + (query ? '?' + query : '');

      function goNext() {
        location.hash = '#' + hashTarget;
      }

      var actionUrl = main.getAttribute('data-payment-action');
      if (actionUrl && actionUrl.trim() && typeof fetch === 'function') {
        btn.disabled = true;
        fetch(actionUrl.trim(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
          .then(function(res) { return res.ok ? Promise.resolve() : Promise.reject(new Error('request failed')); })
          .then(goNext)
          .catch(goNext)
          .finally(function() { btn.disabled = false; });
      } else {
        goNext();
      }
    });

    main.setAttribute(ATTR_INIT, '1');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPayButton);
  } else {
    initPayButton();
  }
})();
