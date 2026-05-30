(function() {
  try {
    var key = 'app_astro-theme';
    var opt = localStorage.getItem(key) || 'system';
    var dark = opt === 'dark' || (opt === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (dark) document.documentElement.setAttribute('data-theme', 'dark');
  } catch(e) {}
})();
