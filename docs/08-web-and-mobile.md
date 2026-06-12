# Web on PC + App on Mobile (one codebase)

**English** · [한국어](./08-web-and-mobile.ko.md)

WAKIT renders the **same views** as a proper website on desktop and a native-style
app on mobile. This is the rule set that makes both look right from one codebase.

---

## 1. Two faces, one source

| | PC / Web | Mobile / App |
|---|---|---|
| Entry point | `index.html` (Bridge) | `app.html` (SPA + `wakit.js`) |
| Look | top-nav header, footer, wide layout | app bar, bottom tab bar, dynamic-view transitions |
| Navigation | `webNav` header menu → file links | `tabs`/`routes` → hash routing |
| Served to | desktop browsers, SEO, sharing | installed PWA, mobile devices |

The `views/*.html` files are **shared** — only the shell and mode differ.

---

## 2. How the engine picks the mode

- `MOBILE_MODE = theme.isMobile === true || isMobileDevice()` (see [01-overview.md](./01-overview.md)).
- `wakit.js` puts a mode class on `<html>`: **`.desktop-mode`** or **`.mobile-mode`**, plus `.pwa-mode`, and `.ios` / `.android` (see [04-wakit-css.md](./04-wakit-css.md)).
- Config (in `wakitConfig.json`):
  - **`theme.isMobile: false`** → desktop browser = `desktop-mode` (web), mobile device = `mobile-mode` (app). **This is what you want for "PC web + mobile app".**
  - `theme.isMobile: true` → app UI even on desktop (kiosk / app-only).
- In `desktop-mode` the engine **hides the app bar and tab bar automatically**; in `mobile-mode` it shows them.

---

## 3. The rules

### Rule 1 — Write views responsively
A view must look like a **desktop web template** at wide widths AND a **mobile app** at narrow widths — not a stretched mobile layout.

- Wrap content in `.container` (max-width + centered on desktop).
- Mobile-first CSS, expand with media queries:

```css
.feature-grid { display: grid; grid-template-columns: 1fr; gap: 16px; } /* mobile: 1 col */
@media (min-width: 768px) {
  .feature-grid { grid-template-columns: repeat(3, 1fr); }              /* desktop: 3 cols */
}
```

### Rule 2 — Diverge with mode classes when web ≠ app
Use the engine's `<html>` classes to render the same view differently:

```css
.desktop-mode .home-hero { padding: 80px 0; }  /* roomy web hero */
.mobile-mode  .home-hero { padding: 24px 0; }  /* compact app */
```

The engine already hides/shows the tab bar and app bar per mode — you only add divergence for **your own content**.

### Rule 3 — Dual navigation (already built)
- **Web**: `webNav` header menu → links to `views/foo.html` (files).
- **Mobile**: `tabs` + `routes` → `<a href="#route">` (hash) → native transition.
- **List → Detail** is the signature flow: on mobile it's a dynamic-view overlay transition; on web it's a page navigation. Both use the same view files.

### Rule 4 — Config for PC-web + mobile-app
```json
{
  "theme": { "isMobile": false, "primaryColor": "#3b82f6" },
  "appbarView": true,
  "tabbar": { "displayMode": "always" }
}
```
`isMobile: false` is the key switch.

### Rule 5 — Follow the view pattern + tokens
- Full-document views, header/footer includes with `data-spa-ignore`, screen CSS in `<body>`, `container` on `<main>` (see [05-template-guide.md](./05-template-guide.md) §6.2, §6.3).
- Style with **foundation tokens** only (`--color-*`, …) → light/dark and consistency come for free.

---

## 4. Checklist

- [ ] `theme.isMobile: false` (unless you intend an app UI on desktop too)
- [ ] Every view: `container` + responsive (grids/columns collapse to 1 column on mobile)
- [ ] Desktop = top nav + footer + wide layout; Mobile = tab bar + transitions
- [ ] `webNav` (web) and `tabs`/`routes` (mobile) point at the **same** view files
- [ ] Tested both ways: desktop browser (website) and narrow / PWA (app)

---

## 5. Common mistakes

- **`app.html` not loading `css/foundation/index.css`** → every `--color-*` is undefined in SPA → **colors vanish on mobile** (web still works because `index.html` loads the tokens). The shell must load the tokens.
- Leaving `isMobile: true` → PC looks like a stretched app, not a website.
- A mobile-only layout stretched full-width on desktop (no media queries) → looks broken on PC.
- Hardcoding colors instead of tokens → dark mode breaks.
- Using hash `#route` links in the **web** header (web should use file links via `webNav`).

---

Next: [05-template-guide.md](./05-template-guide.md) · [04-wakit-css.md](./04-wakit-css.md)
