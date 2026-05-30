# Backend Integration & Agent Guide

**English** · [한국어](./07-backend-integration.ko.md)

This document is for the **developer (or agent) who takes this template and wants to integrate a backend**.
A WAKIT template is not a "finished product" but a **backend-agnostic frontend scaffold**.
This single page lays out where to plug in what, so you can grasp it all at once.

> To the agent: read this file together with [01-overview.md](./01-overview.md) and [02-wakitConfig.md](./02-wakitConfig.md)
> first, and you'll have the structure fully understood. You must adhere to the rules in section 5 below.

---

## 1. What This Template Actually Is

```
생성된 템플릿 (프론트만)
   ├─ 모드 A: 그대로 사용 → 정적 웹 / 설치형 PWA (백엔드 없이도 동작)
   └─ 모드 B: 개발자·에이전트가 받아서 → 자기 서버/API 연동 → 제품 완성
```

- It assumes no particular backend. Supabase is **just one option**, not a requirement.
- The engine (`wakit/js/wakit.js`) knows nothing about the backend. Data and authentication are entirely the responsibility of the view/integration layer.

---

## 2. The Two Runtime Modes (First, Figure Out Which Mode You're In)

| Mode | Entry Point | Condition | Navigation |
|------|--------|------|------------|
| **SPA** | `app.html` | `window.Core` present | `<a href="#route">` hash routing (intercepted by the engine) |
| **Bridge/SSR** | `index.html` | `window.Core` absent | `<a href="views/foo.html">` **direct file link** |

- The scenario where you attach a backend (server rendering / CMS) is usually **Bridge mode**.
- Bridge only handles `<base>` injection, `/views/foo` → `/views/foo.html` normalization, and `data-include` partials — it **does not do routing**. For details, see [03-bridge-and-attributes.md](./03-bridge-and-attributes.md).

---

## 3. The Single Contract — `wakitConfig.json`

The app's structure (pages, menus, theme) is all declared in one place: the `wakitConfig.json` of [02-wakitConfig.md](./02-wakitConfig.md). Read this file first before integrating.

| Key | Purpose | Notes |
|----|------|------|
| `routes[]` | Page pool (path → file) | Used by mobile/SPA |
| `tabs[]` | Mobile bottom tab bar | Read by the engine (`.page`/`.id`) |
| `webNav` | Web header menu | **Direct file href links**, unrelated to `routes` |
| `theme` | Colors, fonts, isMobile | |

> `tabs` (mobile) and `webNav` (web) **may have different configurations** (e.g., 6 items on web / 4 on mobile). The only thing they share is the physical view files.

---

## 4. Where to Plug In the Backend (the seams)

The points you'll touch during integration are gathered into **a small number of clean seams**, as follows.

### 4.1 Data (Most Important)
- Each view (`views/*.html`) fetches data from a plain `<script>` and fills the DOM.
- **Supabase path**: initialize `window.sb` globally in `app.html`/`index.html` → use `window.sb.from(...)`, `window.sb.auth...` from views.
- **Own-backend path**: just replace it with `fetch('/api/...')` in the view's `<script>`. The engine is not involved.

### 4.2 Source of the Navigation Menu
- The web header menu's source is **a single function, `getNavData()`**, in `wakit-components/header.html`.
- By default it reads `webNav` from `wakitConfig.json` via `fetch`. **To switch to server-driven (API/SSR), you only need to replace this one function**.

### 4.3 View Loading / Shared Partials
- Shared partials such as the header and footer are injected in the form `data-include="wakit-components/header.html"` (handled by Bridge).
- Dynamic/overlay views are loaded in SPA mode by fetching `routes[].file`.

### 4.4 Authentication
- When using Supabase Auth, use `window.sb.auth.signUp()/signInWithPassword()`.
- For RLS, use **`app_metadata`** instead of `raw_user_meta_data`.

---

## 5. Rules You Must Follow When Integrating

To avoid conflicting with the engine, you must follow these (violations break things silently).

- **SPA screen navigation** must always use `<a href="#routeName">`. `<button>` + JS navigate does not work.
- New routes must be registered in `tabs` or `routes` in `wakitConfig.json`.
- The **web header menu** is managed via `webNav` and links by **file path**, not by hash.
- Scripts inside views must not use `<script type="module">` → use a plain `<script>` (module scripts are unstable in views).
- Load Supabase via the UMD CDN in `app.html`/`index.html` and use it globally as `window.sb`.

---

## 6. Shipping Agent Context in the Delivery Artifact

For the recipient to **integrate a backend via an agent**, the delivery zip must include the following.
(Currently `scripts/package-template.js` only packs `dist/` + `setup.sql` + a basic README, so manage the items below as additional targets.)

| Item | Nature | How to Produce It |
|------|------|-------------|
| Shared structure description | Identical across all templates | **Copy this `docs/` (or a summarized `WAKIT.md`) verbatim** |
| Per-app description (`AGENT.md`) | Differs per template | **Auto-generated from wizard inputs + a prompt** — tab/page list, `webNav`, the data each view needs, backend integration points |
| `wakitConfig.json` | Contract | Include it in a readable form |
| Integration source | Integration target | Exclude files needed for integration from obfuscation |

> Goal: when the recipient says "hook my backend up to this template," the agent can grasp the structure from a single `AGENT.md` and do the work.

---

## 7. Directory Structure (Integration Perspective)

```
templates/{name}/
├── app.html / index.html   ← entry point (where window.sb is initialized)
├── wakitConfig.json        ← structure contract (routes / tabs / webNav / theme)
├── views/*.html            ← page body + data fetch scripts  ← integration core
├── wakit-components/
│   └── header.html         ← getNavData() (menu source seam)
├── js/                     ← auxiliary scripts such as theme-toggle
└── css/                    ← theme tokens + per-view styles
```

---

Next: [01-overview.md](./01-overview.md) · [02-wakitConfig.md](./02-wakitConfig.md)
