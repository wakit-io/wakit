<script>
  import './app.css';
  let { children } = $props();
</script>

<!-- Web chrome: data-spa-ignore → stripped when the wakit app fetches this page,
     so only the page content lands in the app shell. -->
<nav class="nav" data-spa-ignore>
  <div class="nav__inner">
    <a href="/" class="nav__logo">App SvelteKit</a>
    <div class="nav__links">
      <a href="/">Home</a>
      <a href="/board/">Board</a>
      <a href="/profile/">Profile</a>
    </div>
    <button type="button" class="nav__theme" data-theme-toggle aria-label="Toggle theme"><i class="bi bi-moon-fill"></i></button>
    <a href="/app/app.html" class="nav__cta">Open app</a>
  </div>
</nav>

{@render children()}

<footer class="foot" data-spa-ignore>
  <div class="foot__inner">
    <span>WAKIT · web (SvelteKit) + app (wakit.js)</span>
  </div>
</footer>
