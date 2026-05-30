(function() {
  var KEY = 'app_astro-theme';
  var WAKIT_KEY = 'blog-theme'; // wakit이 initApp 시 읽는 키 — 반드시 동기화 필요

  function isDark() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  }

  function applyDark(dark) {
    var val = dark ? 'dark' : 'light';
    // 우리 키 저장
    localStorage.setItem(KEY, val);
    // wakit applyBlogThemeSync가 읽는 키도 함께 저장
    localStorage.setItem(WAKIT_KEY, val);
    // DOM 적용
    if (dark) document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
    // 프로필 스위치 UI 동기화
    var sw = document.getElementById('themeSwitch');
    if (sw) sw.classList.toggle('is-dark', dark);
  }

  // 홈 토글 버튼 (data-theme-toggle)
  document.addEventListener('click', function(e) {
    var btn = e.target && e.target.closest('[data-theme-toggle]');
    if (!btn) return;
    applyDark(!isDark());
  });

  // 프로필 스위치 (#themeSwitch)
  document.addEventListener('click', function(e) {
    var sw = e.target && e.target.closest('#themeSwitch');
    if (!sw) return;
    applyDark(!isDark());
  });
})();
