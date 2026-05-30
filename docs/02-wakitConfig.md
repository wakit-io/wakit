# wakitConfig.json Schema

**English** · [한국어](./02-wakitConfig.ko.md)

The configuration file that controls app behavior. The default path is `./wakitConfig.json`, and you can specify a different path with `Core.initApp(configPath)`.

## 1. Top-level Key Summary

| Key | Type | Description |
|----|------|------|
| `splashDelay` | number | Wait time (ms) before removing the splash. Default 200 |
| `splashForce` | boolean | If true, shows the splash on desktop as well |
| `defaultTab` | string | Default (main) tab page. Matched against `tabs[].page` or `tabs[].id` |
| `tabs` | array | List of bottom tab bar items (mobile/SPA) |
| `routes` | array | path → file mapping (non-tab routes, mobile/SPA) |
| `webNav` | object | Web header menu (web mode only, links directly to files) |
| `tabbar` | object | Tab bar display / auto-hide options |
| `pullToRefresh` | object | PTR gesture options |
| `theme` | object | Theme (color, font, isMobile) |
| `memory` | object | Memory-related, such as the number of dynamic views |
| `animations` | object | android/ios animation types |
| `security` | object | External HTML fetch permission settings |

---

## 2. tabs

Each item has `id`, `label`, `icon`, and `page`.

```json
{
  "tabs": [
    { "id": "home", "label": "홈", "icon": "🏠", "page": "home" },
    { "id": "profile", "label": "마이", "icon": "👤", "page": "profile" }
  ]
}
```

| Field | Type | Description |
|------|------|------|
| `id` | string | Tab identifier. Used in `#tab-{id}` and the like |
| `label` | string | Text displayed on the tab |
| `icon` | string | Emoji or icon display string |
| `page` | string | Page key matched against the route/view. Linked to `#view-{slug(page)}` within `views` |

---

## 3. routes

path → HTML file (or external URL) mapping. Paths not present in the tabs load a dynamic view from this list.

```json
{
  "routes": [
    { "path": "home", "file": "../views/service-3.html", "title": "WAKIT Template" },
    { "path": "board/view", "file": "board/view.html", "title": "게시판 상세" },
    { "path": "naver", "file": "http://127.0.0.1:51146/...", "title": "네이버" }
  ]
}
```

| Field | Type | Description |
|------|------|------|
| `path` | string | Hash route path (e.g. `board/view`). Accessed via `#path` |
| `file` | string | HTML URL to load. Relative paths are resolved against the theme root (`THEME_BASE`) |
| `title` | string | (optional) Can be used for the browser/app bar title and the like |

- **Relative paths**: `../views/xxx.html`, `board/view.html`, etc. — resolved against the theme root
- **Absolute URLs**: `https?://` — fetched only when allowed by `security.allowExternalRoutes` or `security.allowedOrigins`

---

## 3.5 webNav (Web Header Menu)

Defines the menu to display in the top header in web mode (Bridge). This is a configuration **completely separate from the mobile navigation**.

> **Mobile (`tabs`/`routes`) vs Web (`webNav`)**
> - Mobile/SPA: `<a href="#route">` hash routing — the engine (`wakit.js`) reads `tabs` and `routes` and intercepts it
> - Web/Bridge: `<a href="views/foo.html">` **direct file link** — uses only `webNav`, does not go through `routes`
>
> The two menus can have different compositions (e.g. 6 items for web, 4 mobile tabs). The only thing they share is the physical view files.

```json
{
  "webNav": {
    "brand": { "label": "App Basic", "logo": "✦", "href": "index.html" },
    "items": [
      { "label": "홈", "href": "index.html" },
      { "label": "상세", "href": "views/detail.html" },
      { "label": "영화 홈", "href": "views/movie-home.html" }
    ],
    "cta": { "label": "시작하기", "href": "views/movie-more.html" }
  }
}
```

| Field | Type | Description |
|------|------|------|
| `brand` | object | (optional) Logo area. `{ label, logo, href }`. Uses the header markup default when unset |
| `items` | array | Menu items. Each item is `{ label, href }` — `href` is a **file path** (relative to the theme root) |
| `cta` | object | (optional) Highlighted button on the right. `{ label, href }`. The button is hidden when unset |

- `href` is not a route id but an **actual file path** (e.g. `views/contact.html`). It is resolved against the theme root.
- The header (`wakit-components/header.html`) `fetch`es `wakitConfig.json`, reads `webNav`, and renders the menu. The data source is gathered in a single place, the header script's `getNavData()`, so if you later switch to a server-driven setup (API/SSR), you only need to change this function.
- The item matching the current page is highlighted with the `is-active` class (file path comparison, treating `index.html` and `/` as equivalent).

---

## 4. defaultTab

The page to show on first entry or as the default tab. A value matching `tabs[].page` or `tabs[].id`.

- Supported aliases: `defaultTab`, `defaultTabPage`, `mainTab`, `mainTabPage` (in priority order)
- If none, `tabs[0].page` is used

---

## 5. tabbar

```json
{
  "tabbar": {
    "autoHide": false,
    "hideThreshold": 14,
    "displayMode": "always"
  }
}
```

| Field | Type | Description |
|------|------|------|
| `autoHide` | boolean | If true, hides/shows the tab bar on scroll (mobile, only when the tab bar is shown) |
| `hideThreshold` | number | Scroll delta (px) that triggers auto-hide. Default 14 |
| `displayMode` | string | `"always"` \| `"pwa"`. If `pwa`, the tab bar is shown only in PWA mode |

- The top-level `tabbarAutoHide` and `tabbarAutoHideThreshold` are also used for the same behavior.

---

## 6. pullToRefresh

```json
{
  "pullToRefresh": {
    "threshold": 90,
    "startSlop": 18,
    "damping": 0.35,
    "maxPull": 200
  }
}
```

| Field | Type | Description |
|------|------|------|
| `threshold` | number | PTR activation threshold (px). Default 64 |
| `damping` | number | Screen movement / indicator ratio (0–1). Default 0.5 |
| `maxPull` | number | Maximum gesture recognition distance (px). Minimum 40 |
| `startSlop` | number | Distance (px) below which minor movements are ignored. Alias `activationSlop` |
| `directionLockRatio` | number | Vertical-priority ratio (dy >= dx * ratio). Alias `lockRatio` |
| `ignoreEdgeX` | number | Region (px) where iOS left-edge swipes are ignored. Alias `edgeIgnoreX` |

---

## 7. theme

```json
{
  "theme": {
    "primaryColor": "#232323",
    "font": "Pretendard, system-ui",
    "isMobile": false
  }
}
```

| Field | Type | Description |
|------|------|------|
| `primaryColor` | string | CSS color. Used for accents/active tabs and the like |
| `font` | string | font-family value |
| `isMobile` | boolean | If true, uses the mobile UI (tab bar, PTR, etc.) on desktop as well |

---

## 8. splashDelay / splashForce

- **splashDelay**: Wait time (ms) before hiding the splash. Applied together with the minimum display time (1200ms inside the core)
- **splashForce**: If true, shows the splash even when not on mobile

---

## 9. memory

```json
{
  "memory": {
    "maxDynamicViews": 6
  }
}
```

| Field | Type | Description |
|------|------|------|
| `maxDynamicViews` | number | Maximum number of dynamic views to keep simultaneously. 2 or more. If unset, 4–10 depending on device memory |

---

## 10. animations

```json
{
  "animations": {
    "android": "scale",
    "ios": "slide"
  }
}
```

| Field | Type | Description |
|------|------|------|
| `android` | string | Android dynamic view transition. `scale` \| `slide`, etc. |
| `ios` | string | iOS dynamic view transition. `slide` \| `scale` \| `fade`, etc. |

CSS classes: Integrated with `.android-animation-scale`, `.android-animation-slide`, `.ios-animation-slide`, `.ios-animation-scale`, `.ios-animation-fade`, and the like.

---

## 11. security

```json
{
  "security": {
    "allowExternalRoutes": false,
    "allowedOrigins": ["https://trusted.example.com"]
  }
}
```

| Field | Type | Description |
|------|------|------|
| `allowExternalRoutes` | boolean | If true, allows HTML fetch to any origin |
| `allowedOrigins` | string[] | List of allowed origins. Applied when `routes[].file` is an external URL |

- The same origin is always allowed.
- If `allowExternalRoutes` is true, external URLs can be loaded even without `allowedOrigins`.

---

Next: [03-bridge-and-attributes.md](./03-bridge-and-attributes.md) — Bridge and data attributes
