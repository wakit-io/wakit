# New Template Authoring Guide

**English** · [한국어](./05-template-guide.ko.md)

How to build a new template based on the `app_basic` template.

---

## 1. Folder Structure

```
templates/my-template/
├── index.html                  # Web entry point (SSR/static server)
├── app.html                    # App/SPA entry point (Capacitor packaging, PWA)
├── wakitConfig.json            # Tab, route, and theme config
├── manifest.json               # PWA manifest
├── css/
│   ├── foundation/             # Design tokens (CSS variables)
│   │   ├── index.css           # Entry point that imports everything
│   │   ├── color.css           # Color tokens
│   │   ├── spacing.css         # Spacing tokens
│   │   ├── typography.css      # Typography tokens
│   │   ├── effect.css          # Shadow and effect tokens
│   │   ├── layout.css          # Layout tokens
│   │   ├── icons.css           # Icon tokens
│   │   ├── graphic.css         # Graphic tokens
│   │   ├── buttons.css         # Button tokens
│   │   └── badge.css           # Badge tokens
│   ├── style.css               # Shared layout and component styles
│   └── [screen-name].css       # Per-screen CSS (e.g. home.css, detail.css)
├── js/
│   ├── theme-init.js           # Initial theme setup to prevent FOUC (loaded in head)
│   ├── theme-toggle.js         # Light/dark toggle feature
│   ├── header.js               # Header scroll and state management
│   └── scroll-to-top.js        # Scroll-to-top button
├── views/                      # Per-screen HTML (tab/route content)
│   ├── home.html
│   └── [screen-name].html
└── wakit-components/           # WAKIT shell components
    ├── appbar.html             # Top app bar (mobile only)
    ├── appheader.html          # Header inside dynamic views
    ├── tabbar.html             # Bottom tab bar
    ├── splash.html             # Splash screen
    ├── offcanvas-left.html     # Left side menu
    └── offcanvas-right.html    # Right side menu
```

---

## 2. Entry Point Files

### 2.1 app.html — SPA Entry Point (App / PWA)

Used for Capacitor/Cordova packaging, PWA "Add to Home Screen", and when running the dev server (`npm run dev`).
It loads the WAKIT core (`wakit.js`) as an ES module and calls `Core.initApp()`.

```html
<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1,
        maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover">
  <title>My Template</title>

  <!-- iOS PWA settings -->
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="msapplication-tap-highlight" content="no">

  <!-- PWA manifest -->
  <link rel="manifest" href="./manifest.json">
  <meta name="theme-color" content="#ffffff">

  <!-- Icon libraries (include only what you need) -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn-uicons.flaticon.com/2.1.0/uicons-solid-rounded/css/uicons-solid-rounded.css">
  <link rel="stylesheet" href="https://cdn-uicons.flaticon.com/2.1.0/uicons-regular-rounded/css/uicons-regular-rounded.css">

  <!-- WAKIT base styles -->
  <link rel="stylesheet" href="/wakit/css/wakit.css">
  <link rel="stylesheet" href="/wakit/css/styleGuide.css">
  <link rel="stylesheet" href="/wakit/css/component.css">
  <link rel="stylesheet" href="/wakit/css/wakit-popup.css">

  <!-- Template design tokens + shared styles -->
  <link rel="stylesheet" href="./css/foundation/index.css">
  <link rel="stylesheet" href="./css/style.css">

  <!-- FOUC prevention: set the initial theme value (place at the very bottom of head) -->
  <script src="./js/theme-init.js"></script>
</head>
<body id="root">
  <script type="module">
    import Core from "/wakit/js/wakit.js";
    Core.initApp('./wakitConfig.json');

    // Skip SW registration during local development (avoids cache interfering with live reload)
    const isLocalDev = ['localhost', '127.0.0.1'].includes(location.hostname);
    if ('serviceWorker' in navigator && !isLocalDev) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/wakit/service-worker.js');
      });
    }
  </script>
  <script src="/wakit/js/wakit-popup.js"></script>
  <script>window.Popup && Popup.init();</script>
</body>
</html>
```

> ### 🔒 MUST — `app.html` loads the design tokens
> `app.html` **must** load `./css/foundation/index.css` (the `--color-*` / spacing / type tokens). In SPA mode the views' own token `<link>` carries `data-spa-ignore` and is stripped, so **only the shell provides the tokens**. Omit this line and every `--color-*` becomes undefined → **all colors disappear on mobile** (the page still works on the web because `index.html` loads the tokens itself). Do not hardcode colors in view CSS — use the tokens; no per-view `@import` of foundation is needed.

### 2.2 index.html — Web Entry Point (SSR / Static Server)

Used when accessed from a regular web browser. It loads `wakit-bridge.js`, which handles `data-include` partial processing, base injection, and so on.
SPA features (tabs, dynamic views) do not work here; it serves as a static view for SEO and shareable links.

```html
<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1,
        maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover">
  <title>My Template</title>
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="msapplication-tap-highlight" content="no">
  <link rel="manifest" href="./manifest.json">
  <meta name="theme-color" content="#ffffff">

  <!-- bridge must always use data-spa-ignore (prevents execution in the SPA environment) -->
  <script src="../../../wakit/js/wakit-bridge.js" data-spa-ignore></script>

  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css"
        rel="stylesheet" data-spa-ignore>
  <link rel="stylesheet" href="../../../wakit/css/wakit.css" data-spa-ignore>
  <link rel="stylesheet" href="../../../wakit/css/styleGuide.css" data-spa-ignore>
  <link rel="stylesheet" href="../../../wakit/css/component.css" data-spa-ignore>
  <link rel="stylesheet" href="css/foundation/index.css" data-spa-ignore>
  <link rel="stylesheet" href="css/style.css" data-spa-ignore>
  <script src="js/theme-init.js" data-spa-ignore></script>
</head>
<body>
  <!-- Include partials in SSR style via data-include -->
  <div data-include="wakit-components/header.html"></div>
  <div data-include="views/home.html"></div>
  <div data-include="wakit-components/footer.html"></div>
</body>
<script src="../../../wakit/js/wakit-popup.js" data-spa-ignore></script>
<script src="js/theme-toggle.js" data-spa-ignore></script>
<script src="js/header.js" data-spa-ignore></script>
<script src="js/scroll-to-top.js" data-spa-ignore></script>
<script data-spa-ignore>if (typeof Popup !== 'undefined') Popup.init();</script>
</html>
```

> **`data-spa-ignore` rule**: Always add `data-spa-ignore` to the `<link>` and `<script>` tags in index.html. This prevents duplicate execution when this file is loaded as a view in the SPA environment (`app.html`).

---

## 3. wakitConfig.json

Declares tabs, routes, and theme. The `page`/`path` of tabs and routes must match 1:1.

```json
{
  "splashDelay": 100,
  "splashForce": false,
  "tabbar": {
    "autoHide": false,
    "hideThreshold": 14,
    "displayMode": "always"
  },
  "pullToRefresh": {
    "threshold": 90,
    "startSlop": 18,
    "damping": 0.35,
    "maxPull": 200
  },
  "theme": {
    "primaryColor": "#006fff",
    "font": "Pretendard, system-ui",
    "isMobile": true
  },
  "defaultTab": "home",
  "tabs": [
    { "id": "home",    "label": "홈",  "icon": "fi fi-sr-home",  "page": "home" },
    { "id": "my",      "label": "My",  "icon": "fi fi-sr-user",  "page": "my" }
  ],
  "routes": [
    { "path": "home",   "file": "../views/home.html",   "title": "홈" },
    { "path": "my",     "file": "../views/my.html",     "title": "My" },
    { "path": "detail", "file": "../views/detail.html", "title": "상세" }
  ],
  "webNav": {
    "brand": { "label": "My App", "logo": "✦", "href": "index.html" },
    "items": [
      { "label": "홈",   "href": "index.html" },
      { "label": "상세", "href": "views/detail.html" }
    ],
    "cta": { "label": "시작하기", "href": "views/my.html" }
  }
}
```

**Rules**
- A tab page whose `tabs[].page` equals a `routes[].path` activates that view when the tab is switched.
- A path that exists only in `routes` (e.g. `detail`) opens as a dynamic view (overlay).
- The `routes[].file` path is relative to `THEME_BASE` (the folder containing wakitConfig.json).
- Setting `theme.isMobile: true` enables the mobile UI (app bar, tab bar, PTR) even on desktop.
- `webNav` defines the **web header menu** (`wakit-components/header.html`). It is separate from the mobile `tabs`/`routes`; `items[].href` links directly to a **file path** (relative to the theme root) rather than a hash route. This lets you configure the web and mobile menus differently. For details see [02-wakitConfig.md](./02-wakitConfig.md).

---

## 4. manifest.json

Used for PWA "Add to Home Screen", splash, and so on. `start_url` must be set to `app.html`.

```json
{
  "name": "My Template",
  "short_name": "My Template",
  "start_url": "app.html",
  "lang": "ko-KR",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#ffffff",
  "orientation": "portrait"
}
```

---

## 5. wakit-components/

HTML fragments that the WAKIT core automatically fetches and injects into the shell during initialization.

### 5.1 appbar.html — Top App Bar (Mobile Only)

```html
<header class="appbar">
  <!-- Brand logo shown only on main tabs (the core toggles it automatically) -->
  <a class="brand" id="appbar-brand" href="#" aria-hidden="true" style="display:none">
    <span class="brand-name">My App</span>
  </a>

  <!-- Page title shown when the brand is hidden -->
  <div class="title" id="appbar-title">My App</div>

  <!-- Right-side menu button (enable when needed) -->
  <!-- <div class="appbar-right">
    <button id="btn-menu-right" aria-label="open right menu">☰</button>
  </div> -->
</header>
```

**Required ids**: `appbar-brand`, `appbar-title` — the core controls their show/hide automatically on tab switches.

### 5.2 appheader.html — Header Inside Dynamic Views

Inserted at the top of dynamic views (overlay pages). The back button and title area are required.

```html
<button class="btn-dv-back" aria-label="back"
  onclick="(window.goBackWithAnimation ? window.goBackWithAnimation() : history.back())">←</button>
<div class="title dv-title"></div>
```

**Required classes**: `btn-dv-back` (back), `dv-title` (page title — the core injects the text automatically).

### 5.3 tabbar.html — Bottom Tab Bar

Must match the `tabs` array in `wakitConfig.json` 1:1.

```html
<nav class="tabbar" id="tabbar">
  <!-- id="tab-{tabs[].id}", href="#{tabs[].page}" -->
  <a id="tab-home" href="#home" data-id="home" aria-label="홈" class="active">
    <div class="icon"><span class="fi fi-sr-home"></span></div>
    <span>홈</span>
  </a>
  <a id="tab-my" href="#my" data-id="my" aria-label="My">
    <div class="icon"><span class="fi fi-sr-user"></span></div>
    <span>My</span>
  </a>
</nav>
```

**Rules**
- Always follow the `id="tab-{tabs[].id}"` format.
- `href="#{tabs[].page}"` — on tab click, the hash router activates that view.
- `data-id="{tabs[].id}"` — used by the core to determine the active tab.
- Add `class="active"` to the default active tab (defaultTab).

### 5.4 splash.html — Splash Screen

Displayed full-screen while the app loads. You are free to compose the background, logo, and spinner.

```html
<div style="width:100%;height:100%;display:flex;align-items:center;flex-direction:column;
            justify-content:center;background:#ffffff;z-index:10000">
  <div style="font-size:24px;font-weight:bold;color:#000;margin-bottom:20px;">
    MY APP
  </div>
  <div class="spinner"
       style="width:36px;height:36px;border-radius:50%;
              border:3px solid rgba(0,0,0,.15);
              border-top-color:rgba(0,0,0,.6);
              animation:spin .8s linear infinite">
  </div>
</div>
```

### 5.5 offcanvas-left.html / offcanvas-right.html — Side Menus

Slide-in panels that open when the app bar's menu button is clicked.

```html
<!-- offcanvas-left.html -->
<div style="padding:16px">
  <h3>메뉴</h3>
  <nav>
    <a href="#home">홈</a>
    <a href="#my">마이페이지</a>
  </nav>
</div>
```

---

## 6. views/ — Screen HTML

The content of each screen (tab/route). Per-screen CSS is declared with a `<link>` tag at the top of the file.

```html
<!-- views/home.html -->
<link rel="stylesheet" href="./css/home.css">

<main class="home-page" role="main">
  <section class="home-hero">
    <h1>환영합니다</h1>
    <p>앱 설명 텍스트</p>
  </section>

  <!-- Link that navigates to a dynamic view -->
  <a href="#detail">상세 보기</a>
</main>
```

**Rules**
- `role="main"` is recommended on the screen's root element.
- Declare screen-specific CSS with `<link rel="stylesheet" href="./css/[screen-name].css">`, but place it **inside `<body>` without `data-spa-ignore`** (see 6.2 below). The core automatically removes that CSS when the dynamic view is closed.
- `href="#[path]"` links are handled as either a tab switch or entry into a dynamic view.
- Write `<script>` without `data-spa-ignore` — it runs every time the view loads. If it should run only once, add the `data-once` attribute.

### ⚠️ 6.1 CSS Paths Inside Views — Must-Read Caveat

The wakit SPA fetches view files and dynamically injects them into the DOM. At that point, paths in `<link>` tags are resolved **relative to the location of `app.html`, not the view file**.

```
templates/my-template/
├── app.html          ← path reference point
├── css/
│   └── home.css
└── views/
    └── home.html     ← the <link> paths in this file are also relative to app.html
```

```html
<!-- ❌ Wrong — relative path based on the view file (CSS won't load) -->
<link rel="stylesheet" href="../css/home.css">

<!-- ✅ Correct — relative path based on app.html -->
<link rel="stylesheet" href="./css/home.css">
```

The same rule applies to all resource paths inside the view, including images and JS.

### ⚠️ 6.2 Screen-specific CSS goes inside `<body>`, without `data-spa-ignore`

A screen (view)-specific CSS `<link>` must be declared **inside `<body>`, not in `<head>`, and without `data-spa-ignore`**. This is what makes the styles apply in both web and mobile (SPA) modes.

```html
<head>
  <!-- Shared resources: head + data-spa-ignore (app.html already loads them, so avoid duplicates) -->
  <link rel="stylesheet" href="css/foundation/index.css" data-spa-ignore>
  <link rel="stylesheet" href="css/style.css" data-spa-ignore>
</head>
<body>
  <!-- ✅ Screen-specific CSS: inside body, no data-spa-ignore -->
  <link rel="stylesheet" href="css/login.css">

  <div data-include="wakit-components/header.html"></div>
  <main class="login-page"> ... </main>
</body>
```

**Why**
- A `link`/`style` carrying `data-spa-ignore` is **removed** during SPA injection (see [03-bridge-and-attributes.md](./03-bridge-and-attributes.md)). So putting screen-specific CSS in `<head>` with `data-spa-ignore` means **the screen's styles are dropped in mobile/SPA and the layout breaks.**
- Placed inside `<body>` without `data-spa-ignore`, instead:
  - **Web (Bridge) mode** — applied as an ordinary stylesheet
  - **Mobile (SPA) mode** — when the view is injected as a dynamic view, the core lifts this `<link>` into the head and applies it (tagged for the dynamic view), then **removes it automatically when the view closes** (CSS isolation, see [04-wakit-css.md](./04-wakit-css.md))
- In short: **shared CSS = `<head>` + `data-spa-ignore`**, **screen-specific CSS = `<body>` + no `data-spa-ignore`**.

---

### ⚠️ 6.3 Web Page Structure — Full Document · Shared Components · Container

A view accessed directly by URL (a web-mode page) is written as a **full HTML document**, not a fragment. (Only `home.html`, the default view embedded into `index.html`, is a fragment exception.)

```html
<!doctype html><html lang="ko">
<head>
  <!-- Shared resources: data-spa-ignore (app.html already loads them → avoid SPA duplicates) -->
  <link rel="stylesheet" href="css/foundation/index.css" data-spa-ignore>
  <link rel="stylesheet" href="css/style.css" data-spa-ignore>
  <script src="js/theme-init.js" data-spa-ignore></script>
</head>
<body>
  <!-- Shared component includes: data-spa-ignore (the engine renders the app bar/tab bar in SPA) -->
  <div data-include="wakit-components/header.html" data-spa-ignore></div>

  <!-- Screen-specific CSS: inside body, no data-spa-ignore (6.2) -->
  <link rel="stylesheet" href="css/{screen}.css">

  <main class="{screen} container">…</main>

  <div data-include="wakit-components/footer.html" data-spa-ignore></div>
</body>
<script src="js/theme-toggle.js" data-spa-ignore></script>
</html>
```

**Rules**
- **Shared component includes (header/footer) get `data-spa-ignore`** — in SPA the engine renders the app bar/tab bar, so the web header/footer are excluded.
- **Add the `container` class to `<main>`** — to constrain and center the width on web (desktop).

**Sticky header** — the header is injected inside its `data-include` wrapper `<div>`. `position: sticky` would only stick within that wrapper's box (= header height) and scroll away immediately. Remove the wrapper's box so it sticks relative to the page:

```css
[data-include="wakit-components/header.html"] { display: contents; }
.site-header { position: sticky; top: 0; z-index: 50; }
```

---

## 7. css/foundation/ — Design Tokens

Manages Figma design tokens as CSS variables. `index.css` bundles and imports them all.

```css
/* foundation/index.css */
@import './color.css';
@import './spacing.css';
@import './typography.css';
@import './effect.css';
@import './layout.css';
@import './icons.css';
@import './graphic.css';
@import './buttons.css';
@import './badge.css';
```

Light and dark modes are defined together in `color.css`.

```css
/* foundation/color.css */
:root {
  --color-primary: #3b82f6;
  --color-bg-primary: #ffffff;
  --color-text-primary: #17191a;
  /* ... */
}

[data-theme="dark"] {
  --color-primary: #60a5fa;
  --color-bg-primary: #121212;
  --color-text-primary: #ffffff;
  /* ... */
}
```

---

## 8. js/ — Scripts

### ⚠️ 8.0 Theme Persistence — Must-Read Caveat

wakit.js calls `applyBlogThemeSync()` inside `initApp()`. This function reads the **`'blog-theme'`** key from localStorage to determine the theme. If the key is missing or its value is `'light'`, it runs `removeAttribute('data-theme')`, which **forcibly clears the previously set dark mode**.

As a result, if your custom template stores the theme only under its own localStorage key (e.g. `'app_astro-theme'`), wakit will overwrite it on app restart and dark mode will be cleared.

**Solution principle: store the theme under the same `'blog-theme'` key the engine uses.**

- **Recommended (single key)**: use `'blog-theme'` as your **only** theme key. This is what `app_basic` does — `THEME_STORAGE_KEY = 'blog-theme'` in `theme-init.js`/`theme-toggle.js`. No sync code needed, and it never conflicts with the engine's `themechange` re-apply.
- **Alternative (dual key)**: if you want an isolated template-specific key, save both that key and `'blog-theme'` together on every change (examples 8.1/8.2 below).

> ⚠️ Common bug: if you use only a custom key (e.g. `'app_basic-theme'`), then on toggle a `themechange` fires, the engine reads the empty `'blog-theme'`, and **immediately reverts your change to light** (the "toggle does nothing" symptom). Unifying on `'blog-theme'` fixes it.

> Never modify the core code (`wakit.js`). Handle everything in custom JS only.

---

### 8.1 app.html Inline Script — FOUC Prevention (Required)

Insert it as an inline script at the very bottom of `<head>`. Splitting it into an external file can cause FOUC due to load timing, so be sure to write it inline.

**Key point**: after reading the custom key, you must also sync the `'blog-theme'` key that wakit reads.

```html
<!-- Insert at the very bottom of app.html <head> -->
<script>
  (function() {
    try {
      var v = localStorage.getItem('my-template-theme'); // template-specific key
      var dark = v === 'dark' || (!v && matchMedia('(prefers-color-scheme: dark)').matches);
      // wakit initApp() calls applyBlogThemeSync() with the 'blog-theme' key — must be synced
      localStorage.setItem('blog-theme', dark ? 'dark' : 'light');
      if (dark) document.documentElement.setAttribute('data-theme', 'dark');
    } catch(e) {}
  })();
</script>
```

### 8.2 theme-toggle.js — Theme Toggle (Dual-Key Saving Required)

In the SPA environment, views are mounted dynamically, so use **event delegation** rather than calling `addEventListener` directly. Also, on every toggle you must save the custom key and the `'blog-theme'` key **together**.

```js
// js/theme-toggle.js
(function() {
  var KEY = 'my-template-theme';       // template-specific key
  var WAKIT_KEY = 'blog-theme';        // key wakit reads during initApp — must be synced

  function isDark() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  }

  function applyDark(dark) {
    var val = dark ? 'dark' : 'light';
    localStorage.setItem(KEY, val);       // save the custom key
    localStorage.setItem(WAKIT_KEY, val); // sync the wakit key
    if (dark) document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
    // Sync the switch UI (if present)
    var sw = document.getElementById('themeSwitch');
    if (sw) sw.classList.toggle('is-dark', dark);
  }

  // [data-theme-toggle] button — event delegation (required for SPA)
  document.addEventListener('click', function(e) {
    if (!e.target.closest('[data-theme-toggle]')) return;
    applyDark(!isDark());
  });

  // #themeSwitch toggle button — event delegation
  document.addEventListener('click', function(e) {
    if (!e.target.closest('#themeSwitch')) return;
    applyDark(!isDark());
  });
})();
```

Load it at the end of the `app.html` `<body>`.

```html
<script src="./js/theme-toggle.js"></script>
```

#### System / Light / Dark — 3 Options (optional)

Besides a simple toggle, a settings view can offer **system / light / dark** options using the same delegation. Add `[data-theme-option]` buttons and `theme-toggle.js` handles the clicks via delegation.

```html
<div role="radiogroup" aria-label="Theme">
  <button data-theme-option="system">System</button>
  <button data-theme-option="light">Light</button>
  <button data-theme-option="dark">Dark</button>
</div>
```

```js
document.addEventListener('click', function(e) {
  var opt = e.target.closest('[data-theme-option]');
  if (!opt) return;
  setTheme(opt.getAttribute('data-theme-option')); // 'system'|'light'|'dark' → data-theme + 'blog-theme'
  // sync the active option (.is-active) UI
});
```

> ⚠️ **For this to work in the SPA (app.html), `app.html` must load `theme-toggle.js`.** A view's bottom `<script>` is ignored via `data-spa-ignore`, so controls in dynamically injected views are handled by the delegation listener from the `theme-toggle.js` loaded in the **shell (app.html)**.

### 8.3 Initializing the Switch UI in Profile/Settings Views

In a view that has a toggle switch (`#themeSwitch`), read the current theme state when the view loads and align the switch UI accordingly. The actual toggle behavior is handled by the event delegation in `theme-toggle.js`, so the view's inline script only handles UI syncing.

```html
<!-- bottom of views/profile.html -->
<script>
(function() {
  var sw = document.getElementById('themeSwitch');
  if (sw) {
    sw.classList.toggle('is-dark', document.documentElement.getAttribute('data-theme') === 'dark');
  }
})();
</script>
```

### 8.4 Dark Mode CSS Override — `!important` Required

`wakit.css` hardcodes `color: #060505` on `.tabbar a`. Since icons and text become invisible in dark mode, override it forcibly with `!important` in the template CSS.

```css
/* css/style.css */
[data-theme="dark"] .tabbar {
  background: #1f2937;
  border-top-color: #374151;
}
[data-theme="dark"] .tabbar a {
  color: #ffffff !important; /* override the hardcoded wakit.css color */
}
[data-theme="dark"] .tabbar a.active {
  color: var(--color-primary); /* use the brand color for the active tab */
}
```

---

## 9. Build & Deployment Structure

### 9.1 Project Structure
Each template is an independent project.

```
templates/{template}/
├── app.html              ← wakit mobile app (SPA)
├── views/                ← app view files
├── css/                  ← app styles
├── js/                   ← app scripts
├── wakitConfig.json      ← wakit config
└── web/                  ← Astro web layer
    ├── src/pages/        ← web pages (/, /board, /guestbook, etc.)
    ├── public/
    │   ├── wakit/        ← auto-generated at build time (obfuscated wakit)
    │   └── app/          ← auto-generated at build time (wakit app files)
    └── dist/             ← final build output (for deployment)
```

### 9.2 Build Command
```bash
npm run build:app_astro
```

Build order:
1. webpack: obfuscate wakit.js → `web/public/wakit/`
2. webpack: copy app files → `web/public/app/`
3. astro build: build web pages + include public/ → `dist/`

### 9.3 dist/ Structure (Build Output)
```
dist/
├── index.html            ← landing page
├── board/index.html      ← board
├── guestbook/index.html  ← guestbook
├── app/
│   ├── app.html          ← wakit app entry point
│   ├── views/
│   ├── css/
│   └── js/
└── wakit/
    └── js/wakit.js       ← obfuscation complete
```

### 9.4 Deployment
Upload the `dist/` folder as-is to Netlify, Vercel, or web hosting.

### 9.5 When Creating a New Template
```bash
npm run create:template
```
→ also auto-generates the `web/` folder (Astro) and runs `npm install`

---

## 10. Running the Dev Server

```bash
# wakit app development (webpack dev server)
npm run dev:app_astro        # http://localhost:5173/app/app.html

# Astro web layer development
npm run web:dev             # http://localhost:4321
# or directly
cd templates/app_astro/web && npm run dev
```

---

## 12. Deployment Package Composition

### Delivery Options

| Option | Contents | Audience |
|------|-----------|------|
| **Front-end Template** | `dist/` build files only | Developers who configure the backend themselves |
| **Supabase Integration Version** | `dist/` + `supabase/setup.sql` | Users who want to launch a service quickly |

### Packaging Command

```bash
npm run package:app_astro   # build + auto-generate a ZIP including the schema
```

Output: `packages/hybrid-ui-template-app_astro-v1.0.0.zip`

```
Package internal structure
├── dist/                  ← build files to upload to the web server
│   ├── index.html         ← landing page
│   ├── app/app.html       ← wakit SPA entry point
│   └── wakit/             ← obfuscated wakit engine
├── supabase/
│   └── setup.sql          ← DB schema (run in the Supabase SQL Editor)
├── README.md              ← installation guide
└── LICENSE.txt
```

### Installation Steps for Supabase Integration Version Users

1. Upload the `dist/` folder to your web hosting
2. Create a new project in the Supabase dashboard
3. Run `supabase/setup.sql` in the SQL Editor (auto-creates tables, RLS, triggers)
4. In `dist/app/app.html`, replace the URL and anon key with your own values

```html
window.sb = supabase.createClient(
  'https://YOUR_PROJECT.supabase.co',
  'YOUR_ANON_KEY'
);
```

---

### [TODO] Setup Wizard

> Planned for future implementation — improves the UX of the Supabase integration version

**Goal:** Enable non-developers to integrate Supabase directly from the browser without editing any files.

**Flow:**
```
First app launch
    ↓
Check for the Supabase config values in localStorage
    ↓ if missing
Show the initial setup page (URL + anon key input form)
    ↓ on save
Save to localStorage, then enter the app normally
(setup page is skipped on subsequent visits)
```

**SQL Migration Handling Options:**
- Option A: Also collect the Service Role Key and have the app create the tables directly via API (once, initially)
- Option B: Provide a link to the Supabase SQL Editor — on button click, show the contents of setup.sql (recommended)

**Implementation location:** `views/setup.html` + register it as the initial route in `wakitConfig.json`

---

## 13. Checklist

When building a new template, verify the following items in order.

- [ ] Create the `templates/my-template/` folder
- [ ] `app.html` — write the SPA entry point
- [ ] `index.html` — write the web entry point (`data-spa-ignore` on all tags)
- [ ] `wakitConfig.json` — configure tabs, routes, and theme
- [ ] `manifest.json` — verify `start_url: "app.html"`
- [ ] `css/foundation/index.css` — set up the design token imports
- [ ] `css/style.css` — include shared styles + the dark mode tabbar override (`!important`)
- [ ] `app.html` `<head>` inline script — sync the custom key + `'blog-theme'` (FOUC prevention)
- [ ] `js/theme-toggle.js` — save the custom key + `'blog-theme'` simultaneously, using event delegation
- [ ] `wakit-components/appbar.html` — include the `#appbar-brand`, `#appbar-title` ids
- [ ] `wakit-components/appheader.html` — include the `.btn-dv-back`, `.dv-title` classes
- [ ] `wakit-components/tabbar.html` — use the `id="tab-{id}"` format, match `tabs` 1:1
- [ ] `wakit-components/splash.html` — splash screen
- [ ] `views/home.html` — at least one view file
- [ ] Verify it runs correctly with `npm run dev -- --env template=my-template`
