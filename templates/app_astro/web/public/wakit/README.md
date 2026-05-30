# WAKIT Engine

**English** · [한국어](./README.ko.md)

The lightweight hybrid runtime at the heart of WAKIT. Build with a single set
of HTML / CSS / JS, run it as a website, and package the same code into a
native app via a WebView wrapper (Capacitor / Cordova) — so it feels like
React Native or Flutter without leaving the web platform.

This folder is the engine only. It is copied into a template's build output and
served alongside the app. For the full project — templates, build pipeline, and
packaging — see the [project root README](../README.md).

## Contents

### `js/`

| File              | Role                                                                                                       |
| ----------------- | ---------------------------------------------------------------------------------------------------------- |
| `wakit.js`        | SPA core — config load, app-shell render, tab/router, dynamic-view overlay stack, Pull-to-Refresh, off-canvas, theming, link interception. Active when `window.Core` exists. |
| `wakit-bridge.js` | SSR/static bridge — no-op in SPA mode; on plain pages it injects a `<base>`, normalizes pretty URLs (`views/foo` → `views/foo.html`), and resolves `data-include` partials. |
| `wakit-popup.js`  | Standalone popup library — opens HTML from `<a class="popup" href="...">` as a modal or sheet, runs inline/external scripts in the loaded HTML. Works without `Core` and has no dependencies. API: `Popup.init()`, `Popup.open(url, opts)`, `Popup.close()`. |

### `css/`

| File              | Role                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------ |
| `wakit.css`       | App-shell styles — reset, CSS variables, app bar, tab bar, views, dynamic views, off-canvas, Pull-to-Refresh, splash, dark mode. |
| `wakit-popup.css` | Popup styles for `wakit-popup.js` (uses an `hy-` class prefix to avoid collisions).        |
| `styleguide.css`  | Design tokens — typography scale and color variables (Pretendard-based).                   |
| `component.css`   | Reusable UI component styles (post lists, section headers, frames, etc.).                  |

### `assets/`

| Folder          | Contents                              |
| --------------- | ------------------------------------- |
| `icons/`        | PWA app icons (192×192, 512×512).     |
| `buttons/`      | Inline button icon SVGs.              |
| `social-login/` | Social-login mark SVGs (e.g. GitHub). |

### PWA

| File                | Role                                                           |
| ------------------- | -------------------------------------------------------------- |
| `manifest.json`     | PWA manifest (name, icons, display mode, theme color).         |
| `service-worker.js` | Service worker — cache-first fetch for offline/installable use. |

## Runtime modes

The engine picks its mode automatically:

- **SPA** — when `window.Core` is present (after `Core.initApp(configPath)`),
  `wakit.js` drives routing, tabs, dynamic views, PTR, off-canvas, and theming.
- **SSR/static** — when `window.Core` is absent, only `wakit-bridge.js` runs,
  handling `<base>` injection, pretty URLs, and `data-include`.

## Global API (SPA)

- `window.Core.initApp(configPath)` — initialize the app shell.
- `window.goBackWithAnimation()` — programmatic back (closes a dynamic view if
  one is open, otherwise `history.back()`).
- `window.openOffcanvas('left' | 'right')` / `window.closeOffcanvas()`.
- `window.Popup.init()` / `Popup.open(url, opts)` / `Popup.close()`.

## Documentation

Detailed guides live in the project root [`docs/`](../docs) (`01-overview` →
`06-design-guide`).
