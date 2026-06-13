# Building a wakit Native App (Hard Rules) 🔒

**English** · [한국어](./10-wakit-native-app.ko.md)

> **These are the hard rules for building a DYNAMIC app (login / DB data) as a wakit `/app/app.html`.**
> Break this structure and the app screens won't render. (Learned the hard way: built it as SvelteKit csr first, it didn't render in the app shell.)

---

## 0. Why — how wakit.js works (must understand)

`Core.initApp(config)` → load wakitConfig → decide `MOBILE_MODE` → render appbar/tabbar → **hash routing**. How a screen renders:

```
click <a href="#route">
  → engine intercepts, fetches routes[].file
  → extractBodyInnerHTML  (take <body> only + drop [data-spa-ignore])
  → inject into mount.innerHTML
  → executeInlineScripts  (re-run ONLY plain injected <script>)
```

So **wakit is an engine that fetches HTML, injects the body, and runs plain scripts. It does NOT boot a framework runtime.**

### 🔒 Absolute rules that follow
- **csr framework pages (SvelteKit `csr=true`, Astro client islands, …) do NOT render in the wakit shell** — their module-based SPA runtime can't boot in the injected context.
- **Single-source (the app fetches web pages) only works if those pages are `csr=false` pure static HTML** (marketing / content pages).
- **A dynamic app's screens MUST be "wakit native views"** = plain HTML + plain `<script>` + `window.sb`.
- **Web (SvelteKit/Astro) and app (wakit) routing run SEPARATELY.** Same backend (Supabase), separate frontends.

---

## 1. Structure (follow app_todo exactly)

```
templates/{app}/
├── app.html                  ← wakit shell: window.sb + Core.initApp + shared js + design css
├── wakitConfig.json          ← tabs + routes(→ ../views/*.html), hash routing
├── wakit-components/
│   ├── tabbar.html           ← bottom tabs: <a href="#route" data-id="route">
│   ├── appbar.html / appheader.html / splash.html
├── views/                    ← app screens (fragment + plain <script> + window.sb)
│   ├── home.html list.html favorites.html settings.html
│   ├── detail.html login.html …
├── css/todo.css              ← design system (loaded by the shell)
├── js/todo-app.js            ← shared helpers window.TodoApp (loaded by the shell)
└── web/                      ← (optional) SvelteKit/Astro web — separate routing from the app
```

---

## 2. Shell `app.html` (MUST)

```html
<head>
  <link rel="stylesheet" href="/wakit/css/wakit.css"> … (engine css)
  <link rel="stylesheet" href="./css/foundation/index.css">  <!-- color tokens: shell MUST load -->
  <link rel="stylesheet" href="./css/todo.css">              <!-- app design system -->
  <!-- global Supabase client: views use window.sb from plain <script> -->
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>
  <script>
    window.sb = supabase.createClient(URL, ANON_KEY, { auth:{ persistSession:true } });
  </script>
  <script src="./js/todo-app.js"></script>  <!-- shared helpers window.TodoApp -->
  <script src="./js/theme-init.js"></script> <!-- dark/light FOUC guard (key blog-theme) -->
</head>
<body id="root">
  <script type="module">
    import Core from "/wakit/js/wakit.js";
    Core.initApp('./wakitConfig.json');
  </script>
  <script src="./js/theme-toggle.js"></script> <!-- delegates data-theme-option -->
</body>
```

> To reach Supabase from a real device, `URL` must be the **Mac LAN IP / deployed domain, not localhost** (127.0.0.1 points to the device itself).

---

## 3. `wakitConfig.json` (MUST)

```json
{
  "appbarView": true,
  "theme": { "isMobile": false },
  "defaultTab": "home",
  "tabs": [
    { "id": "home", "label": "Home", "icon": "bi bi-house", "page": "home" }
  ],
  "routes": [
    { "path": "home", "file": "../views/home.html", "title": "App" },
    { "path": "detail", "file": "../views/detail.html", "title": "Detail" }
  ]
}
```
- Tabs go in `tabs[]`; every screen goes in `routes[]` (path↔file). Non-tab screens (detail, …) must also be registered in `routes`.

---

## 4. `wakit-components/tabbar.html` (MUST)

```html
<nav class="tabbar" id="tabbar">
  <a id="tab-home" href="#home" data-id="home" class="active">
    <div class="icon"><i class="bi bi-house"></i></div><span>Home</span>
  </a>
  …
</nav>
```
- **Links MUST be `#route` hashes + `data-id`.** (A path href like `/todos/` won't navigate in the app.)

---

## 5. Views `views/*.html` (MUST — the core)

```html
<main class="page">
  <div id="body"><div class="spinner-row">Loading…</div></div>
</main>
<script>
(async function () {
  var T = window.TodoApp, sb = T.sb;       // provided by the shell
  var user = await T.getUser();            // auth check
  // load data with window.sb + build DOM (vanilla)
  var r = await sb.from('todos').select('*').order('created_at',{ascending:false}).limit(10);
  document.getElementById('body').innerHTML = (r.data||[]).map(T.itemCard).join('');
})();
</script>
```

### 🔒 View rules
1. **Fragment (or a full HTML doc)** — `extractBodyInnerHTML` takes the body if present, else injects the whole thing.
2. **Data/logic in a plain `<script>`** — **NO `type="module"`** (unstable on injection). Use `window.sb` / `window.TodoApp`.
3. **Navigation = `<a href="#route">`** — no path links.
4. **Params (detail id, …) = `sessionStorage` + plain `#route`.** Do **NOT** put a query in the hash like `#detail?id=X` — the engine's route lookup fails on a query-bearing path. (On item click: `sessionStorage.setItem('id', …)` → `#detail` → the detail view reads it.)
5. **Infinite scroll** = `IntersectionObserver` (sentinel) + `sb…range(from, from+N-1)`.
6. **Delegated events** = bind once on the container (don't loop per-item). `preventDefault` on buttons inside item links.
7. **After auth changes (login/logout) call `location.reload()`** — tab views load once and are cached, so reload to reflect state.
8. **Theme** = just place `data-theme-option="system|light|dark"` buttons; the shell's `theme-toggle.js` delegates them (key `blog-theme`).

---

## 6. Design / Theme
- Put the design system (tokens + components) in `css/todo.css` (loaded by the shell). Dark via `[data-theme="dark"]` overrides.
- Tokens only. Button = black bg / white text (inverted in dark), inputs rounded, restrained hover motion.

---

## 7. Never do this (❌)
- ❌ Build app screens as **csr SvelteKit/Svelte components** and expect the wakit shell to render them → **blank.**
- ❌ **Path hrefs (`/todos/`)** in tabs/links → app routing fails. Use `#route`.
- ❌ **`#route?query`** for params → route lookup fails. Use sessionStorage.
- ❌ **`<script type="module">`** in views → unstable on injection. Use a plain script.
- ❌ Supabase URL as **127.0.0.1** while testing on a real device → unreachable. Use the LAN IP / deployed domain.

---

## 8. Checklist
- [ ] app.html: `window.sb` + `Core.initApp` + shared js + design css + tokens
- [ ] wakitConfig: tabs + every screen in routes (→ ../views/*.html)
- [ ] tabbar: `#route` + `data-id`
- [ ] views: fragment + plain `<script>` + `window.sb`/`window.TodoApp`
- [ ] detail: sessionStorage + `#detail`
- [ ] infinite scroll / delegation / auth-reload / theme (data-theme-option)
- [ ] real device: Supabase URL = LAN IP / deployed domain
- [ ] web (SvelteKit) and app (wakit) routing kept separate

---

See also: [03-bridge-and-attributes.md](./03-bridge-and-attributes.md) · [07-backend-integration.md](./07-backend-integration.md) · [09-web-layer.md](./09-web-layer.md)
