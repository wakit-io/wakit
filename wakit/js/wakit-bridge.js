/* Lightweight bridge for SSR pages so links like "views/xxx.html" work anywhere.
 * - No-op in SPA (when window.Core exists)
 * - In SSR, injects a <base> pointing to the theme root (directory above /views/)
 */
(function () {
  try {
    // SPA 환경이면 아무것도 하지 않음
    if (window.Core) return;

    var doc = document;
    if (!doc) return;

    // 옵션: base 주입을 끄고 싶으면 메타 플래그 사용
    var disableBase = !!doc.querySelector('meta[name="hybrid:disable-base"]');
    var disablePretty = !!doc.querySelector('meta[name="hybrid:disable-pretty-urls"]');

    var href = String(location.href);
    // e.g., .../templates/blog/views/home(.html)? → base := .../templates/blog/
    var m = href.match(/^(.*\/)(?:views)\/[^\/?#]+(?:\.html)?(?:[?#].*)?$/i);
    if (m && !disableBase) {
      var themeRoot = m[1] || '';
      // 이미 base가 있으면 유지
      if (!doc.querySelector('head base')) {
        var base = doc.createElement('base');
        base.setAttribute('href', themeRoot);
        (doc.head || doc.documentElement).appendChild(base);
      }
    }

    // 정적 서버(SSR)에서 새로고침 시 404 방지를 위해
    // /views/foo 형태를 /views/foo.html 로 정규화 (.html이 없으면 추가)
    if (!disablePretty) {
      var loc = window.location;
      var path = loc.pathname || '';
      var normalized = path
        // /views/foo/ → /views/foo.html
        .replace(/(\/views\/)([^\/]+)\/$/i, '$1$2.html')
        // /views/foo → /views/foo.html
        .replace(/(\/views\/)([^\/\.]+)$/i, '$1$2.html');
      if (normalized !== path) {
        var newUrl = normalized + (loc.search || '') + (loc.hash || '');
        try { history.replaceState(history.state, doc.title || '', newUrl); } catch (_) { /* noop */ }
      }
    }
  } catch (_) {
    // noop
  }
})();

// --- lightweight partials/include for static pages ---
(function(){
  try{
    if (window.Core) return; // SPA면 코어가 처리
    var doc = document;
    // Security: in SSR/static mode, block cross-origin includes by default.
    // Override: add <meta name="hybrid:allow-external-routes" content="1"> to allow.
    var allowExternalRoutes = !!doc.querySelector('meta[name="hybrid:allow-external-routes"]');
    function qsa(sel, parent){ return Array.prototype.slice.call((parent||doc).querySelectorAll(sel)); }
    function execScripts(container){
      var scripts = qsa('script', container);
      scripts.forEach(function(old){
        var s = doc.createElement('script');
        Array.prototype.forEach.call(old.attributes, function(a){ s.setAttribute(a.name, a.value); });
        if (old.src){ s.async = false; doc.body.appendChild(s); }
        else { s.textContent = old.textContent||''; container.appendChild(s); }
        old.remove();
      });
    }
    function processStyles(container){
      var head = doc.head || doc.documentElement;
      qsa('link[rel="stylesheet"]', container).forEach(function(old){
        var link = doc.createElement('link');
        Array.prototype.forEach.call(old.attributes, function(a){ link.setAttribute(a.name, a.value); });
        head.appendChild(link); old.remove();
      });
    }
    function subst(html, props){
      if (!props) return html; try{ return html.replace(/\$\{(\w+)\}/g, function(_,k){ return (k in props)? String(props[k]) : ''; }); }catch(e){ return html; }
    }
    function isMobile(){ try{ return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent); }catch(_){ return false; } }
    function includeMode(){ return isMobile() ? 'mobile' : 'web'; }

    function run(){
      var mode = includeMode();
      var nodes = qsa('[data-include]:not([data-include-processed="1"])');
      if (!nodes.length) return;
      nodes.forEach(function(el){
        var when = (el.getAttribute('data-include-when')||'both').toLowerCase();
        var ok = (mode==='mobile') ? (when==='mobile'||when==='both') : (when==='web'||when==='both');
        if (!ok){ el.setAttribute('data-include-processed','1'); return; }
        var url = el.getAttribute('data-include')||'';
        if (!url){ el.setAttribute('data-include-processed','1'); return; }
        // resolve include URL so it works from nested paths like views/board/view.html
        // - components/*, assets/*, _css/*, views/* → resolve against theme root (dir above /views/)
        // - otherwise (e.g., item.html, ./partials/x.html) → resolve against current document directory
        try{
          if (!/^https?:|^\//i.test(url)){
            var hrefNow = String(location.href);
            var docDir = hrefNow.replace(/[^\/?#]*([?#].*)?$/, '');
            var themeMatch = hrefNow.match(/^(.*\/)(?:views)\//i);
            var themeRoot = (themeMatch && themeMatch[1]) ? themeMatch[1] : docDir;
            var useThemeRoot = /^(wakit-components|assets|_css|views)\//i.test(url);
            var baseFor = useThemeRoot ? themeRoot : docDir;
            url = new URL(url, baseFor).href;
          }
        }catch(_){ }
        // Block cross-origin HTML fetch unless explicitly allowed.
        try{
          var abs = new URL(url, location.href);
          if (abs.origin !== location.origin && !allowExternalRoutes) {
            el.setAttribute('data-include-processed','1');
            return;
          }
        }catch(_){
          el.setAttribute('data-include-processed','1');
          return;
        }

        fetch(url, { credentials:'same-origin' }).then(function(r){ return r.ok ? r.text() : ''; }).then(function(html){
          if (!html) return;
          var props=null; try{ props=JSON.parse(el.getAttribute('data-props')||''); }catch(_){ props=null; }
          el.innerHTML = subst(html, props);
          processStyles(el);
          execScripts(el);
          el.setAttribute('data-include-processed','1');
        }).catch(function(){ el.setAttribute('data-include-processed','1'); });
      });
    }
    if (doc.readyState==='loading') doc.addEventListener('DOMContentLoaded', run, { once:true });
    else run();
  }catch(_){}
})();

