<!-- Home (main) — single source. Renders on the web at / and ALSO inside the wakit
     app (Home tab). Styles come from the shared /app-shared.css (no scoped <style>),
     so the content survives injection into the app shell. -->
<section class="home-hero">
  <span class="sc-badge">Single source · SvelteKit</span>
  <h1 class="home-hero__title">Web routing by SvelteKit,<br>app by wakit.js</h1>
  <p class="home-hero__desc">
    The web layer is real file-based routing (prerendered to pure static HTML),
    while the mobile app runs on the wakit engine. One template, two routers — no collision.
  </p>
  <div class="home-hero__actions">
    <a href="/board/" class="home-btn home-btn--primary">Explore web routes</a>
    <a href="/app/app.html" class="home-btn home-btn--ghost">Open the app</a>
  </div>
</section>

<section class="home-cards">
  <article class="home-card">
    <h3>SvelteKit web</h3>
    <p>File-based routes under <code>src/routes</code>, prerendered with <code>adapter-static</code>. No runtime JS shipped.</p>
  </article>
  <article class="home-card">
    <h3>wakit app</h3>
    <p>Hash-routed SPA shell at <code>/app/app.html</code> with native transitions, tabbar and themes.</p>
  </article>
  <article class="home-card">
    <h3>Shared content</h3>
    <p>This page is authored once and renders on the web and inside the app alike.</p>
  </article>
</section>
