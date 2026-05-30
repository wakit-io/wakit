/**
 * App Hotel 전역 테마 관리자
 * - app.html <head>에서 한 번 로드되어 window.HotelTheme을 노출
 * - document 이벤트 위임으로 [data-theme-option] 클릭을 처리
 *   → 동적 뷰(SPA) 주입 타이밍, onclick 실행 컨텍스트에 무관하게 동작
 */
(function () {
  'use strict';

  var KEY = 'app_hotel-theme';
  var ATTR = 'data-theme';

  function systemTheme() {
    return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
      ? 'dark' : 'light';
  }

  function savedOption() {
    try {
      var v = localStorage.getItem(KEY);
      if (v === 'light' || v === 'dark' || v === 'system') return v;
    } catch (_) {}
    return 'system';
  }

  function applyOption(option) {
    var actual = (option === 'system') ? systemTheme() : option;
    if (actual === 'dark') {
      document.documentElement.setAttribute(ATTR, 'dark');
    } else {
      document.documentElement.removeAttribute(ATTR);
    }
    try { localStorage.setItem(KEY, option); } catch (_) {}
    try {
      document.dispatchEvent(new CustomEvent('hotel:themechange', {
        detail: { theme: actual, option: option }
      }));
    } catch (_) {}
  }

  // settings 페이지의 선택 카드 UI를 현재 저장값에 맞게 갱신
  function syncUI() {
    var current = savedOption();
    var btns = document.querySelectorAll('[data-theme-option]');
    for (var i = 0; i < btns.length; i++) {
      var active = btns[i].getAttribute('data-theme-option') === current;
      btns[i].classList.toggle('is-active', active);
      btns[i].setAttribute('aria-checked', String(active));
    }
  }

  // ── 이벤트 위임 ──────────────────────────────────────────────────
  // document 레벨에서 한 번만 등록 → 동적 주입된 버튼도 모두 잡힘
  document.addEventListener('click', function (e) {
    var btn = e.target && e.target.closest && e.target.closest('[data-theme-option]');
    if (!btn) return;
    var option = btn.getAttribute('data-theme-option');
    if (!option) return;
    applyOption(option);
    syncUI();
  });

  // settings 뷰 진입 시 또는 탭 복귀 시 UI 재동기화
  document.addEventListener('hotel:syncThemeUI', syncUI);

  // 시스템 테마 변경 감지
  try {
    window.matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', function () {
        if (savedOption() === 'system') applyOption('system');
      });
  } catch (_) {}

  // 전역 API
  window.HotelTheme = {
    setOption: applyOption,
    getOption: savedOption,
    syncSettingsUI: syncUI
  };
}());
