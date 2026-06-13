# WAKIT Documentation

**English** · [한국어](./README.ko.md)

**WAKIT** is a lightweight SPA engine for hybrid apps: build with a single set of
web code, then package the app in a WebView so it *feels* like a native app
(React Native / Flutter style) to the user. These docs cover its usage and
configuration.

## Table of contents

| Document | Description |
|----------|-------------|
| [01-overview.md](./01-overview.md) | WAKIT overview, architecture, file roles, init flow |
| [02-wakitConfig.md](./02-wakitConfig.md) | `wakitConfig.json` schema and options |
| [03-bridge-and-attributes.md](./03-bridge-and-attributes.md) | `wakit-bridge.js`, data attributes, meta tags |
| [04-wakit-css.md](./04-wakit-css.md) | `wakit.css` variables, layout, classes |
| [05-template-guide.md](./05-template-guide.md) | Building a new template (folder structure, file roles, checklist) |
| [06-design-guide.md](./06-design-guide.md) | Design guidelines |
| [07-backend-integration.md](./07-backend-integration.md) | Backend integration & agent guide (integration seams, rules, delivery context) |
| [08-web-and-mobile.md](./08-web-and-mobile.md) | One codebase → proper website on PC + native-style app on mobile (rules) |
| [09-web-layer.md](./09-web-layer.md) | Web framework layer (Astro/SvelteKit) — app_sveltekit setup, single-source content |

## Quick reference

- **SPA entry point**: `Core.initApp('./wakitConfig.json')` (default config path)
- **SSR/static pages**: loading only `wakit-bridge.js` handles `<base>` injection, pretty URLs, and `data-include`
- **Config file**: `wakitConfig.json` at the theme root (tabs, routes, `webNav`, splash, PTR, etc.)
