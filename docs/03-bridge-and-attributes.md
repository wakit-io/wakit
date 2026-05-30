# wakit-bridge.js / data attributes / meta tags

**English** · [한국어](./03-bridge-and-attributes.ko.md)

## 1. Role of wakit-bridge.js

A lightweight script that runs **only when not an SPA** (when `window.Core` is absent). It provides two features.

### 1.1 Base injection (correct relative paths under SSR)

- **Purpose**: Ensure that relative paths like `views/xxx.html` also work correctly on nested pages (e.g., `views/board/view.html`).
- **Behavior**: When the current URL is of the form `.../templates/blog/views/home` or `.../views/home.html`, the directory above it (the theme root) is added to `head` as `<base href="...">`.
- **Disable**: If `<meta name="hybrid:disable-base" content="...">` is present, base injection is skipped.

### 1.2 Pretty URL normalization (avoid 404 on refresh)

- **Purpose**: When a static server is accessed via `/views/foo` but the actual file is `views/foo.html`, the URL is changed to `.../views/foo.html` to prevent a 404 on refresh.
- **Behavior**:  
  - `/views/foo/` → `/views/foo.html`  
  - `/views/foo` → `/views/foo.html`  
  Only the address is swapped via `history.replaceState`.
- **Disable**: If `<meta name="hybrid:disable-pretty-urls" content="...">` is present, normalization is skipped.

### 1.3 data-include (partial / include, SSR only)

- **Purpose**: Fetch an HTML fragment remotely and insert it on a static/SSR page.
- **Behavior**:  
  - Find `[data-include="url"]` elements, fetch `url`, and replace the element's `innerHTML` with the response HTML.  
  - `<link rel="stylesheet">` is moved to `head`; `<script>` is copied into a new element and executed, and the original script is removed.  
  - If a JSON string is provided in `data-props`, `${key}` substitution is supported.
- **Display condition**: `data-include-when="mobile"|"web"|"both"` (default `both`). mobile/web is distinguished by User-Agent.
- **URL resolution**:  
  - If it starts with `wakit-components/`, `assets/`, `_css/`, or `views/`, it is resolved relative to the **theme root**.  
  - Otherwise (e.g., `./partials/x.html`), it is resolved relative to the **current document directory**.
- **Cross-origin**: By default only the same origin is allowed. To allow a different origin, `<meta name="hybrid:allow-external-routes" content="1">` is required.
- **Processed marker**: A processed node is tagged with `data-include-processed="1"`.

---

## 2. Meta tags (hybrid / wakit)

| meta name | Description | Used in |
|-----------|-------------|---------|
| `hybrid:disable-base` | If present, skip base injection | SSR |
| `hybrid:disable-pretty-urls` | If present, skip pretty URL normalization | SSR |
| `hybrid:allow-external-routes` | If present, allow external `data-include` under SSR | SSR |
| `hybrid:disable-onboarding` | If present, disable the onboarding overlay | SPA |
| `hybrid:disable-intro` | If present, disable the intro overlay | SPA |
| `wakit:no-dv-title` | When content="1" or true, do not show the page title in the dynamic view header | head of the loaded HTML |

---

## 3. data attributes (SPA / common)

### 3.1 include / partials (wakit.js in SPA, bridge in SSR)

| Attribute | Value | Description |
|-----------|-------|-------------|
| `data-include` | URL | URL of the HTML fragment to fetch |
| `data-include-when` | `mobile` \| `web` \| `both` | Environment to display in. Default `both` |
| `data-props` | JSON string | Object used for `${key}` substitution |
| `data-include-cache` | `once` | In SPA, cache the once-loaded HTML (reuse for the same key) |
| `data-include-processed` | (set automatically) | `1` when processing is complete |

### 3.2 Style/script control (SPA)

| Attribute | Location | Description |
|-----------|----------|-------------|
| `data-spa-ignore` | Any element (`link`, `style`, `script`, `div`, etc.) | **Regular elements**: not rendered into the DOM during SPA injection. **link/style**: removed instead of being lifted to head. **script**: not executed. |
| `data-once` | `link`, `style`, `script` | Applied/executed only once globally. Deduplicated by key |

### 3.3 Tabs / routing

| Attribute | Element | Description |
|-----------|---------|-------------|
| `href="#page"` | `a` | Hash route. Tab switch or route entry |
| `data-tab` | `a` | Tab page to switch to on click (can be used instead of href) |
| `data-link` | `a` | Path to navigate to on mobile. Falls back to `href` if absent |
| `data-link-block` | `a` | If present, block the default click action |
| `data-new-window` | `a` | Open in a new window (similar to target="_blank") |

### 3.4 Off-canvas

| Attribute | Description |
|-----------|-------------|
| `data-open-offcanvas` | `left` \| `right` — open the off-canvas in the given direction on click |
| `data-close-offcanvas` | Close the off-canvas on click |
| `.open-offcanvas-left`, `.open-offcanvas-right` | Open trigger via class as well |
| `.offcanvas-close` | Close trigger via class |

### 3.5 Closing overlays

| Attribute/class | Description |
|-----------------|-------------|
| `data-close-onboarding`, `.onboarding-close` | Close the onboarding overlay |
| `data-close-intro`, `.intro-close` | Close the intro overlay |

### 3.6 Dynamic view (internal use)

| Attribute | Description |
|-----------|-------------|
| `data-path` | Route path of the dynamic view |
| `data-used` | `1` = in use, `0` = empty slot |
| `data-closing` | `1` = closing |

### 3.7 Comments

| Attribute | Description |
|-----------|-------------|
| `data-comments-init` | JSON string. Comment module initialization options (apiBase, context, contextId, etc.) |

### 3.8 Theme

| Attribute | Description |
|-----------|-------------|
| `data-theme` | `dark` \| `light`, etc. When set on the root/container, applies dark mode etc. (integrated with wakit.css) |

---

## 4. Global functions (SPA)

- **`goBackWithAnimation()`**: Back action. If a dynamic view exists, close one; otherwise `history.back()`.
- **`openOffcanvas(which)`**: `which` is `'left'` or `'right'`.
- **`closeOffcanvas()`**: Close the open off-canvas.

Next: [04-wakit-css.md](./04-wakit-css.md) — CSS variables and layout
