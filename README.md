# WAKIT

**Build your UI once in plain web code — ship it as a website, a PWA, and a
native app, with native-style screen transitions.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
![PWA](https://img.shields.io/badge/PWA-ready-5A0FC8.svg)
![Capacitor](https://img.shields.io/badge/Native-Capacitor%20%2F%20Cordova-119EFF.svg)
![Dependencies](https://img.shields.io/badge/runtime%20deps-0-success.svg)

WAKIT is a lightweight hybrid UI framework. You build with a single set of
HTML / CSS / JS and run it three ways from the *same* source:

- as a **normal website** in the browser,
- as an installable **PWA** (manifest + service worker included),
- as a **native app** packaged through a WebView wrapper (Capacitor / Cordova)
  and shipped to the app stores.

The headline feature is feel: WAKIT layers **native-style screen transitions**
— hash-based routing with a dynamic-view overlay stack, short directional
animations, Pull-to-Refresh, and iOS swipe-back — on top of ordinary web pages,
so the result reads like React Native or Flutter without leaving the web
platform.

> WAKIT is **not** just another web-only SPA framework. It is a hybrid *shell*:
> single codebase → web + PWA + native packaging → feels like a real app.

---

## Why WAKIT

- **Native-style screen transitions** — the core differentiator. Hash routing
  with a dynamic-view overlay stack drives short directional page transitions
  (Android / iOS styles), Pull-to-Refresh, and iOS swipe-back, all honoring
  `prefers-reduced-motion`. This is what makes a web page *feel* like an app.
- **One codebase, three targets** — the same source runs as a website, an
  installable PWA, and a store-ready native app (Capacitor / Cordova).
- **Lightweight & memory-aware** — LRU-managed dynamic views, warm/cold tabs,
  and faster first paint keep transitions smooth even on low-end devices.
- **Theming built in** — CSS-variable theming, light/dark mode, app bar, tab
  bar, off-canvas drawers, and splash screens out of the box.
- **Template-driven** — each project lives as a self-contained template, with
  scripts to create, build, and package them.

---

## How it works

WAKIT runs in one of two modes, chosen automatically:

| Mode           | Condition                              | Script             | Capabilities                                                        |
| -------------- | -------------------------------------- | ------------------ | ------------------------------------------------------------------- |
| **SPA**        | `window.Core` present (`Core.initApp`) | `wakit.js`         | Full engine: routing, tabs, dynamic views, PTR, off-canvas, theming |
| **SSR/static** | `window.Core` absent                   | `wakit-bridge.js`  | Lightweight: `<base>` injection, pretty URLs, `data-include` partials |

### Core files

| File                | Role                                                                                          |
| ------------------- | --------------------------------------------------------------------------------------------- |
| `js/wakit.js`       | SPA core — config load, app-shell render, tab/router, dynamic views, PTR, off-canvas, link interception |
| `js/wakit-bridge.js`| SSR bridge — `<base>` injection, `/views/foo` → `/views/foo.html`, `data-include` handling     |
| `wakitConfig.json`  | App config — tabs, routes, splash, PTR, theme, tab-bar options                                 |
| `css/wakit.css`     | Base reset, CSS variables, and styles for app bar / tab bar / views / off-canvas / PTR / splash / dark mode |

### Routing in brief

- **Entry point** — a `location.hash` change triggers `onHashChange()`.
- **Tab pages** — match `tabs[].page` in config → activate the matching view.
- **Non-tab routes** — match `routes[].path` → fetch the route's HTML and show
  it as a dynamic (overlay) view.
- **External URLs** — allowed only when the security config opts in
  (`security.allowExternalRoutes` or `security.allowedOrigins`).

> Navigation must use `<a href="#routeName">`. Routes must be registered in
> `wakitConfig.json` under `tabs` or `routes`.

---

## Project structure

```
wakit/                  ← the SPA engine (this package)
├── js/                 ← wakit.js (core), wakit-bridge.js (SSR)
├── css/                ← wakit.css and component styles
├── assets/             ← icons, buttons, social-login marks
├── manifest.json       ← PWA manifest
└── service-worker.js

templates/{name}/       ← one independent app per template
├── app.html            ← SPA entry point
├── wakitConfig.json    ← tabs / routes / theme config
├── views/              ← per-route view HTML
├── css/ · js/          ← per-view styles and scripts
├── wakit-components/   ← appbar / tabbar / appheader / splash
├── manifest.json       ← PWA config
└── web/                ← Astro web layer (landing page, SEO)

supabase/               ← local dev environment + migrations
scripts/                ← template create / delete / package automation
docs/                   ← detailed documentation (01–06)
```

`app_test` is the reference template — new templates are copied from it.

---

## Getting started

```bash
npm install

# Run a template in the webpack dev server
npm run dev:app_test       # → http://localhost:5173/app/app.html

# Run the Astro web layer for that template
cd templates/app_test/web && npm run dev   # → http://localhost:4321
```

Available templates: `app_test`, `app_basic`, `app_hotel`, `app_theme`.

### Build

```bash
npm run build:app_test     # webpack (obfuscate + copy) → astro build → dist/
npm run preview            # serve the built dist/ for verification
```

The build pipeline:

```
npm run build:{name}
  → webpack: obfuscate wakit.js   → templates/{name}/web/public/wakit/
  → webpack: copy app files       → templates/{name}/web/public/app/  (excludes dist/, web/)
  → astro build                   → templates/{name}/dist/   (deployable output)
```

### Package (for distribution)

```bash
npm run package:app_test
# → packages/hybrid-ui-template-app_test-v1.0.0.zip
#    ├── dist/             ← built files to host on a web server
#    └── supabase/setup.sql ← DB schema (template-scoped migrations)
```

---

## Template automation

```bash
npm run create:template    # copy folder + npm install + register npm scripts
npm run delete:template    # remove folder + unregister npm scripts
```

Creating or deleting a template automatically registers/removes its
`dev:{name}`, `build:{name}`, and `package:{name}` scripts in `package.json`.

---

## Supabase integration

Templates can wire up Supabase for auth and data:

```js
// app.html
window.sb = supabase.createClient(
  'http://127.0.0.1:54321',
  'sb_publishable_...'
);
```

- Auth via `window.sb.auth.signUp()` / `signInWithPassword()`.
- Each template uses its own schema (e.g. `app_test.profiles`).
- Use `app_metadata` (not `raw_user_meta_data`) for RLS.

---

## Global API (SPA)

- `window.Core.initApp(configPath)` — initialize the app shell.
- `window.goBackWithAnimation()` — programmatic back (closes a dynamic view if
  one is open, otherwise `history.back()`).
- `window.openOffcanvas('left' | 'right')` / `window.closeOffcanvas()`.

---

## Documentation

Detailed guides live in [`docs/`](./docs):

1. `01-overview.md` — concept and SPA init flow
2. `02-wakitConfig.md` — config schema
3. `03-bridge-and-attributes.md` — SSR bridge and data attributes
4. `04-wakit-css.md` — styling and CSS variables
5. `05-template-guide.md` — building a template
6. `06-design-guide.md` — design guidelines

---

## License

Released under the [MIT License](./LICENSE). © 2026 wakit-io.
