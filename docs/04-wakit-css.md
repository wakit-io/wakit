# wakit.css — Variables, Layout, Classes

**English** · [한국어](./04-wakit-css.ko.md)

Defines the base styles needed for the WAKIT app shell and view transitions. Also includes dark mode, iOS/Android-specific styles, a PWA-only tab bar, and more.

## 1. CSS Variables (:root)

| Variable | Default | Description |
|------|--------|------|
| `--primary-color` | `#ffffff` | Accent/active color (e.g. active tab). Overridden by the theme |
| `--bg` | `#ffffff` | Background color |
| `--text` | `#111111` | Default text color |
| `--appbar-height` | `56px` | App bar height |
| `--tabbar-height` | `65px` | Tab bar height |
| `--transition` | `220ms ease` | Common transition duration |
| `--ios-ease` | `cubic-bezier(.25,.8,.25,1)` | iOS transition curve |
| `--ios-dur` | `520ms` | iOS transition duration |
| `--ios-dur-fast` | `300ms` | iOS short transition |
| `--ios-zfix` | `0.1px` | z correction for iOS layer alignment |
| `--parallax-shift` | `-60px` | (Optional) parallax intensity |
| `--tab-count` | (set in JS) | Used to compute the iOS tab bar glass slider width |

---

## 2. Reset & Base

- `* { box-sizing: border-box }`
- `html, body`: `height: 100vh`, `margin: 0`, `background: var(--bg)`, `color: var(--text)`, left/right `env(safe-area-inset-*)` padding
- `a`: removes underline, inherits color. Removes outline and tap highlight on focus/active/hover
- Mobile (768px and below): `::-webkit-scrollbar { display: none }`

---

## 3. App Bar (.appbar)

- **Position**: fixed at top, `z-index: 10`. Height including the top safe area: `calc(var(--appbar-height) + env(safe-area-inset-top))`
- **Layout**: flex, left area (.appbar-left), right area (.appbar-right)
- **Classes**:
  - `.appbar.appheader`: for the header inside a dynamic view, `z-index: 201`
  - `.appbar .title`, `.brand-name`: title/brand styles
  - `.appbar-button`: button padding
- **Desktop**: `.desktop-mode .appbar` → `display: none`

---

## 4. Tab Bar (.tabbar)

- **Position**: fixed at bottom. Height `calc(var(--tabbar-height) + env(safe-area-inset-bottom))`, top border, translucent background + backdrop-filter
- **Tab links**: flex, vertically aligned, icon + text. `.tabbar a.active` → `color: var(--primary-color)`, `font-weight: 600`
- **iOS only** (`.ios .tabbar`):
  - bottom margin, rounded box, glass style
  - glass slider via `::before` (position of the active tab). Uses `--glass-slider-x`, `--tab-count`
  - `.tabbar a .icon.tab-click-animate`: `tabIconBounce` animation on click
- **Hidden**: `.tabbar.hide` → `transform: translateY(100%)`
- **Desktop**: `.desktop-mode .tabbar` → `display: none`
- **PWA only**: `.tabbar-pwa-only:not(.pwa-mode) .tabbar` → hidden. `.tabbar-pwa-only.pwa-mode .tabbar` → shown

---

## 5. View Container (.views / .view)

- **.views**: the container that holds tabs/pages.  
  - Desktop: `min-height: 100dvh`, overflow auto  
  - Mobile: top padding `calc(var(--appbar-height) + env(safe-area-inset-top))`, bottom padding `calc(var(--tabbar-height) + env(safe-area-inset-bottom))`, `min-height: 100vh`
- **.view**: an individual tab view. `position: absolute`, `inset: 0`, default `opacity: 0`, `pointer-events: none`
- **.view.active**: `opacity: 1`, `transform: translateX(0)`, `pointer-events: auto`, `z-index: 2`
- **Direction transitions**: `.view.anim-in-right`, `.view.anim-in-left`, `.view.anim-out-right`, `.view.anim-out-left` (translateX ±24px)
- **.view .page**: on mobile, padding equal to the app bar/tab bar height. With **.no-tabbar**, the bottom padding is removed

---

## 6. Dynamic View (.dynamic-view)

- **CSS isolation**: When switching to a dynamic view in the SPA, the per-page CSS is injected into the head. To prevent the styles of the previous page (A) from being applied to the next page (B) due to identical class names, wakit.js marks links/styles for dynamic views with `data-wakit-dynamic-view` and `data-wakit-view-path`, and **when that view is closed** removes only that view's styles from the head. As a result, only the styles of the currently visible dynamic view are in effect, and on back navigation the previous view's styles are applied again.
- **Base**: `position: fixed`, `width: 100%`, `min-height: 100vh`, slides in from the right (`transform: translateX(100%)`), `z-index` in the `150` range
- **.dynamic-view .page**: the content area below the header. Top padding, `height: 100vh`, `overflow: auto`
- **Backdrop**: `.dynamic-view-backdrop` — translucent black. Shown with `.show`. z-index 149
- **Loading**: `.dynamic-loading` — full-screen loading. Shown with `.show`. Inner `.spinner` animation
- **iOS**:  
  - unified slide transition duration/curve, `translate3d` + `--ios-zfix`  
  - `.dynamic-view.active` / `.closing` states  
  - body/appbar/tabbar shift left when `.dynamic-active` is set (`.dv-shift-left`)
- **Android**:  
  - `.android-animation-scale`: scale + opacity  
  - `.android-animation-slide`: translateY + opacity
- **iOS per-type**: `.ios-animation-slide`, `.ios-animation-scale`, `.ios-animation-fade`
- **During gestures**: with `html.no-gesture-anim`, transitions/animations are removed and only zFix is kept

---

## 7. Off-canvas (.offcanvas)

- **.offcanvas**: fixed left/right, `width: min(80%, 320px)`, top/bottom safe area padding
- **.offcanvas.right** / **.offcanvas.left**: slides in from the right/left respectively. With `.open`, `transform: translateX(0)`
- **.offcanvas-backdrop**: full-screen translucent. Shown with `.show`. `z-index: 199`

---

## 8. Pull-to-Refresh (.pull-to-refresh)

- Positioned right below the app bar. `.ptr-indicator`, `.spinner` styles
- z-index 201

---

## 9. Splash / Onboarding / Intro

- **.splash-overlay**: full screen, `z-index: 300`. Visibility controlled with `.show` / `.hide`
- **.onboarding-overlay**, **.intro-overlay**: `z-index: 301`, 302. Shown with `.show` / `.hide`

---

## 10. Mode & Device Classes

| Class | When Applied | Effect |
|--------|-----------|------|
| `.desktop-mode` | Desktop | Hides app bar/tab bar, adjusts .views padding |
| `.mobile-mode` | Mobile | View padding, body transitions, PTR/swipe, etc. |
| `.ios` | iOS | Tab bar / dynamic view specific styles, safe area |
| `.android` | Android | Dynamic view scale/slide styles |
| `.no-tabbar` | No tab bar | Removes .views bottom padding |
| `.pwa-mode` | Running as a PWA | Used when showing the PWA-only tab bar |

---

## 11. Dark Mode ([data-theme="dark"])

- When `data-theme="dark"` is set on the root or an ancestor:
  - Overrides `--primary-color`, `--bg`, `--text`
  - `.appbar`, `.tabbar`, `.offcanvas`, `.dynamic-view`, `.dynamic-view-backdrop`, `.dynamic-loading`, `.pull-to-refresh .spinner`, splash/onboarding/intro backgrounds, and so on are changed to dark colors

---

## 12. iOS Stabilization Overrides

- `.dynamic-view`, `.appbar`, `.tabbar`: layer separation via `backface-visibility: hidden`, `contain: layout paint style`, `isolation: isolate`
- iOS slide transitions are unified with `--ios-dur`, `--ios-ease`, `--ios-zfix`
- With `html.no-gesture-anim`, transitions/animations are removed to prevent flickering during gestures

---

This concludes the first pass over wakit.css. On a documentation website, you can link the table of contents from [01-overview](./01-overview.md) through [04-wakit-css](./04-wakit-css.md).
