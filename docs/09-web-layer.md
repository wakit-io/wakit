# Web Framework Layer (Astro / SvelteKit)

**English** · [한국어](./09-web-layer.ko.md)

A template can stay pure HTML/CSS/JS, OR add an **optional `web/` folder** that runs a
real web framework for routing and SEO. The framework is **pluggable** — the build
pipeline only runs `npm run build` inside `web/`, so it doesn't care which one you use.

| Template | Web layer | Web routing |
|----------|-----------|-------------|
| `app_basic` | none | `index.html` (Bridge) + `webNav` file links |
| `app_astro` | Astro | `src/pages/` |
| `app_sveltekit` | **SvelteKit** | `src/routes/` (file-based, prerendered) |

> The wakit **app** side (`app.html` + `views/` + `wakit.js`) is identical across all
> three. Only the **web** side changes. The two routers stay separate: **SvelteKit owns
> web routing, wakit owns the app shell** — they never collide.

---

## 1. How the layer plugs in (framework-agnostic)

[`scripts/build-template.js`](../scripts/build-template.js) and
[`webpack.config.js`](../webpack.config.js) detect the `web/` folder and adapt:

```
npm run build:<template>
  ├─ webpack: obfuscate wakit.js → web/public/wakit/
  │           copy app files     → web/public/app/   (paths rewritten)
  └─ web/ present? → npm run build inside web/  (astro build OR vite build)
                     → outputs to templates/<template>/dist/
     web/ absent?  → webpack already wrote dist/ directly
```

So adding SvelteKit needed **no change to webpack or the build script** — only the
`web/` project itself.

---

## 2. SvelteKit setup (app_sveltekit)

The integration is intentionally small. Key files in `templates/app_sveltekit/web/`:

### `svelte.config.js` — static output, reuse webpack assets
```js
adapter: adapter({ pages: '../dist', assets: '../dist', strict: true }),
files: { assets: 'public' }   // ← webpack writes web/public/{app,wakit}; use it as the static dir
```
- **`adapter-static`** → the site prerenders to plain files in `../dist`.
- **`files.assets = 'public'`** → SvelteKit's static directory is `public/`, which is exactly
  where webpack already drops `app/` and `wakit/`. No webpack change, no path juggling.

### `src/routes/+layout.js` — pure static, zero runtime
```js
export const prerender = true;       // every route → static HTML at build time
export const csr = false;            // no client JS bundle shipped → pure HTML/CSS
export const trailingSlash = 'always'; // /board → /board/ (dir index, dev & build match)
```
`csr = false` is what keeps the output framework-runtime-free — the built `index.html`
contains **zero `<script>` tags**, matching wakit's zero-dependency philosophy.

### `vite.config.js` — dev serves `/app` and `/wakit`, on a dedicated port
```js
server: { port: 5180 },             // ← never collides with webpack dev (5173+)
plugins: [devServeAppWakit, sveltekit()]
```
`devServeAppWakit` is a tiny middleware that serves `/app/*` (the wakit app) and
`/wakit/*` (the engine source) during `vite dev`, so the web and app are reachable from
one server.

> **`sveltekit()` is imported from `@sveltejs/kit/vite`** (not `@sveltejs/vite-plugin-svelte`).

---

## 3. Build & run

```bash
# Build (webpack obfuscation + SvelteKit prerender → dist/)
npm run build:app_sveltekit

# Preview the built static site
npx serve templates/app_sveltekit/dist -l 5173
```

Dev servers — **distinct ports so they never clash** (both serve `/app` and `/wakit`):

| Run | Command | URL |
|-----|---------|-----|
| SvelteKit web | `cd templates/app_sveltekit/web && npm run dev` | `http://localhost:5180` |
| app (webpack) | `npm run dev:app_sveltekit` | `http://localhost:5173/app/app.html` |
| app_basic | `npm run dev:app_basic` | `http://localhost:5173/app/app.html` |

> webpack templates share base port 5173 (auto-incrementing to 5174…). The SvelteKit web
> server is pinned to **5180** so running it alongside any template never mixes up which
> server answers `/app`.

---

## 4. Single-source content (web + app share SvelteKit pages)

The headline capability: **author a page once in SvelteKit, render it on the web AND
inside the wakit app.** No duplicate `views/*.html` for shared screens.

```
SvelteKit /board/  ── app fetch ──▶  wakit app shell (app.html)
  <nav data-spa-ignore>      ┐         engine: extractBodyInnerHTML
  <section class="board">    │ body    → drops [data-spa-ignore]   (web nav/footer gone)
  <footer data-spa-ignore>   ┘         → injects content into the app shell
                                       /app-shared.css styles it
```

How the engine loads a route ([wakit.js](../wakit/js/wakit.js)): it `fetch`es the route's
`file`, then `extractBodyInnerHTML()` **removes every `[data-spa-ignore]` element** and
injects the remaining `<body>` content. Three things make sharing work:

### 4.1 Mark web chrome with `data-spa-ignore`
In `web/src/routes/+layout.svelte`, the web `<nav>` and `<footer>` carry `data-spa-ignore`,
so they are stripped when the app fetches the page — only the page content lands in the app.

### 4.2 Put shared styles in `web/public/app-shared.css` (NOT scoped `<style>`)
Injected pages **drop their `<head>`**, so Svelte scoped `<style>` (which compiles to a
`<head>` `<link>`) would not survive into the app. Shared-content styles live in one static
file that **both shells load**:
- `web/src/app.html` (SvelteKit web shell) → `<link href="%sveltekit.assets%/app-shared.css">`
- `app.html` (wakit app shell) → `<link href="/app-shared.css">`

Use plain, unscoped class names (`.board`, `.post`) for shared content.

### 4.3 Point `routes[].file` at the SvelteKit route
```json
"routes": [
  { "path": "home",   "file": "../views/home.html", "title": "App SvelteKit" },
  { "path": "list",   "file": "../../board/",       "title": "Board" },
  { "path": "detail", "file": "../../board/1/",     "title": "Post" },
  { "path": "profile","file": "../views/profile.html","title": "My" }
]
```
The engine always prefixes `file` with `./views/` (only `http(s)://` bypasses it). From the
app at `/app/app.html`, **`../../board/` escapes that prefix to reach the site root** →
`/board/`. Because of `trailingSlash: 'always'`, `/board/` resolves the same in dev (clean
URL) and build (`board/index.html`).

> **You can mix.** Above, `home`/`profile` are native wakit views while `list`/`detail`
> come from SvelteKit. Native screens keep their own `views/css`; shared screens come from
> SvelteKit. Convert more screens by pointing their `file` at the matching route.

---

## 5. Caveats

- **Intra-content links do a full navigation in the app.** A `/board/1/` link inside shared
  content is a real URL, so tapping it in the app navigates the whole page rather than doing
  an in-app dynamic-view transition. The two routers share *content*, not *link semantics*.
- **`app-shared.css` is fixed light.** To follow the app's dark mode, map its `--sc-*`
  variables onto the foundation tokens (`--color-*`).
- **Shared content cannot use Svelte scoped `<style>`** — it lives in `<head>` and is dropped
  on injection. Use `app-shared.css`.
- Keep `csr = false` for shared routes: a hydration bundle would not run correctly once the
  body is lifted out of its `<head>` and injected into the app.

---

## 6. File map (app_sveltekit/web)

| File | Role |
|------|------|
| `svelte.config.js` | adapter-static, `files.assets = 'public'`, output → `../dist` |
| `vite.config.js` | dev `/app`·`/wakit` middleware, port 5180 |
| `src/routes/+layout.js` | `prerender` / `csr=false` / `trailingSlash` |
| `src/routes/+layout.svelte` | web chrome (`data-spa-ignore` nav/footer) |
| `src/routes/+page.svelte`, `board/…` | web pages = shared content |
| `public/app-shared.css` | shared content styles (loaded by both shells) |
| `public/app/`, `public/wakit/` | webpack output (generated; gitignored) |

---

Next: [08-web-and-mobile.md](./08-web-and-mobile.md) · [05-template-guide.md](./05-template-guide.md) · [07-backend-integration.md](./07-backend-integration.md)
