# WAKIT Overview

**English** · [한국어](./01-overview.ko.md)

## 0. Purpose

**WAKIT** was created with a single goal.

- Develop with a **single web codebase**, and use that code for both web and apps in a **hybrid manner** at the same time.
- The web runs in the browser as-is, while the app is **packaged as a webview** (Capacitor, Cordova, etc.) and distributed to the stores.
- From the user's perspective, the goal is to make it feel like "one app" **just like React Native or Flutter** — that is, to deliver an experience **close to a native app**.

So WAKIT is not a "web-only SPA framework," but a **hybrid shell** for **single codebase → web + app packaging → making it feel like an app**.

---

## 1. What WAKIT Is

**WAKIT** is a **lightweight SPA core** tailored to the goal above. It handles both web and packaged apps with the same HTML/JS/CSS.

- **Technical goals**: memory adaptation (LRU dynamic views, tab warm/cold), improved first paint, short transition animations, `prefers-reduced-motion` support — so it feels as smooth as an app.
- **How it works**: it provides an **app-like flow** through hash routing (`#path`), tab switching, a dynamic view (overlay) stack, Pull-to-Refresh, iOS swipe back, and more.

## 2. Distinguishing Usage Environments

| Environment | Condition | Script Used | Notes |
|------|------|----------------|------|
| **SPA** | `window.Core` exists (`Core.initApp()` called after wakit.js loads) | `wakit.js` | Full features: routing, tabs, dynamic views, PTR, etc. |
| **SSR/Static** | `window.Core` absent | `wakit-bridge.js` | base injection, pretty URLs, `data-include` partials only |

`wakit-bridge.js` operates only when not in SPA mode; in SPA mode it does nothing.

## 3. File Roles

| File | Role |
|------|------|
| **wakit.js** | SPA core. Config loading, app shell rendering, tabs/router, dynamic views, PTR, off-canvas, link interception, etc. |
| **wakit-bridge.js** | Lightweight bridge for SSR. `<base>` injection, `/views/foo` → `/views/foo.html` normalization, `data-include` handling |
| **wakitConfig.json** | App config (tabs, routes, `webNav` (web header menu), splash, PTR, theme, tab bar options, etc.). Default path `./wakitConfig.json` |
| **wakit.css** | Base reset, CSS variables, app bar/tab bar/view/dynamic view/off-canvas/PTR/splash/dark mode styles |

## 4. SPA Initialization Flow (`Core.initApp`)

1. **Load config**: `fetch(configPath)` → store `appConfig`
2. **Apply config**: tab bar displayMode, memory (maxDynamicViews), PTR, tab bar auto-hide, animation type (android/ios), `THEME_BASE` computation
3. **Determine mode**: `MOBILE_MODE = theme.isMobile === true || isMobileDevice()`
4. **Splash**: on mobile or when `splashForce`, show the splash and apply a minimum display time
5. **Theme**: `applyTheme(appConfig.theme)`, `applyBlogThemeSync()`, `themechange` listener
6. **App shell**: `renderAppShell()` — app bar, view container, tab bar, off-canvas, backdrop, etc.
7. **Inject theme components**: `hydrateAppbarFromTheme()`, `hydrateOffcanvasFromTheme()`, (when the tab bar is shown) `hydrateTabbarFromTheme()`
8. **Tabs**: `initTabs(appConfig.tabs)`, `initOffcanvas()`, (when the tab bar is shown) `initTabbarAutoHide()`
9. **Preload**: `preloadTabPages()`
10. **Router**: `initRouter()` — `hashchange` listener + initial entry `onHashChange()`
11. **Mobile only**: link interception, PTR, overlay close, iOS swipe back
12. **Popup**: `window.Popup?.init()`
13. **Global back navigation**: assign `window.goBackWithAnimation`
14. **Schedule splash removal**: `scheduleHideSplash(splashDelayMs)` (mobile)

## 5. Routing Overview

- **Entry point**: `location.hash` change → `onHashChange()`
- **Tab page**: when it matches a `page` in `appConfig.tabs`, the corresponding view (`#view-{slug(page)}`) is activated
- **Non-tab route**: when it matches a `path` in `appConfig.routes`, the corresponding `file` HTML is fetched and shown as a dynamic view
- **External URL**: if it starts with `https?://`, the security config is checked via `isAllowedHtmlFetch()` and, if allowed, it opens in a new window or loads internally

## 6. Security (HTML fetch)

- **Default**: HTML fetch is allowed only for the same origin
- **Config**: an external URL is allowed when `appConfig.security.allowExternalRoutes === true` or when the origin is included in the `security.allowedOrigins` array
- **SSR**: external include can be allowed via `<meta name="hybrid:allow-external-routes" content="1">` (bridge)

## 7. Global API (SPA)

- **`window.Core`**: the core object. Public method `initApp(configPath)`
- **`window.goBackWithAnimation()`**: programmatic back (closes the dynamic view if one exists, otherwise `history.back()`)
- **`window.openOffcanvas(which)`** / **`window.closeOffcanvas()`**: open/close the off-canvas (`which`: `'left'` | `'right'`)

Next: [02-wakitConfig.md](./02-wakitConfig.md) — config schema
