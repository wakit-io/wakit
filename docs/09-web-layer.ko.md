# 웹 프레임워크 레이어 (Astro / SvelteKit)

[English](./09-web-layer.md) · **한국어**

템플릿은 순수 HTML/CSS/JS로 둘 수도 있고, **선택적 `web/` 폴더**를 붙여 라우팅·SEO용
실제 웹 프레임워크를 돌릴 수도 있습니다. 이 프레임워크는 **교체 가능(pluggable)** 합니다 —
빌드 파이프라인은 `web/` 안에서 `npm run build`만 실행하므로 어떤 프레임워크든 상관없습니다.

| 템플릿 | 웹 레이어 | 웹 라우팅 |
|--------|-----------|-----------|
| `app_basic` | 없음 | `index.html`(Bridge) + `webNav` 파일 링크 |
| `app_astro` | Astro | `src/pages/` |
| `app_sveltekit` | **SvelteKit** | `src/routes/` (파일 기반, 프리렌더) |

> wakit **앱** 쪽(`app.html` + `views/` + `wakit.js`)은 세 템플릿 모두 동일합니다. 바뀌는 건
> **웹** 쪽뿐입니다. 두 라우터는 분리 유지 — **SvelteKit이 웹 라우팅, wakit이 앱 셸을 담당**하며
> 서로 충돌하지 않습니다.

---

## 1. 레이어가 붙는 방식 (프레임워크 무관)

[`scripts/build-template.js`](../scripts/build-template.js) 와
[`webpack.config.js`](../webpack.config.js) 가 `web/` 폴더를 감지해 자동 분기합니다:

```
npm run build:<template>
  ├─ webpack: wakit.js 난독화 → web/public/wakit/
  │           앱 파일 복사     → web/public/app/   (경로 재작성)
  └─ web/ 있음? → web/ 안에서 npm run build  (astro build 또는 vite build)
                  → templates/<template>/dist/ 로 출력
     web/ 없음?  → webpack이 이미 dist/ 로 직접 출력
```

그래서 SvelteKit 추가에 **webpack·빌드 스크립트 수정은 전혀 필요 없었고**, `web/` 프로젝트만
만들면 됐습니다.

---

## 2. SvelteKit 세팅 (app_sveltekit)

통합은 의도적으로 작습니다. `templates/app_sveltekit/web/` 의 핵심 파일:

### `svelte.config.js` — 정적 출력, webpack 산출물 재사용
```js
adapter: adapter({ pages: '../dist', assets: '../dist', strict: true }),
files: { assets: 'public' }   // ← webpack이 web/public/{app,wakit} 를 채움 → 이걸 static 디렉터리로 사용
```
- **`adapter-static`** → 사이트가 `../dist` 에 순수 정적 파일로 프리렌더됨.
- **`files.assets = 'public'`** → SvelteKit의 static 디렉터리를 `public/` 으로 지정. 이미 webpack이
  `app/`·`wakit/` 를 떨구는 위치라, webpack 변경도 경로 조정도 필요 없음.

### `src/routes/+layout.js` — 순수 정적, 런타임 0
```js
export const prerender = true;       // 모든 라우트 → 빌드 시 정적 HTML
export const csr = false;            // 클라이언트 JS 번들 미포함 → 순수 HTML/CSS
export const trailingSlash = 'always'; // /board → /board/ (디렉터리 인덱스, dev·빌드 동일)
```
`csr = false` 가 출력을 **프레임워크 런타임 없는** 상태로 만듭니다 — 빌드된 `index.html` 에
**`<script>` 태그가 0개**, wakit의 무의존성 철학과 일치합니다.

### `vite.config.js` — dev에서 `/app`·`/wakit` 서빙, 전용 포트
```js
server: { port: 5180 },             // ← webpack dev(5173~)와 절대 안 겹침
plugins: [devServeAppWakit, sveltekit()]
```
`devServeAppWakit` 는 `vite dev` 중 `/app/*`(wakit 앱)·`/wakit/*`(엔진 소스)를 서빙하는 작은
미들웨어라, 웹과 앱을 한 서버에서 볼 수 있습니다.

> **`sveltekit()` 는 `@sveltejs/kit/vite` 에서 import** 합니다 (`@sveltejs/vite-plugin-svelte` 아님).

---

## 3. 빌드 & 실행

```bash
# 빌드 (webpack 난독화 + SvelteKit 프리렌더 → dist/)
npm run build:app_sveltekit

# 빌드된 정적 사이트 미리보기
npx serve templates/app_sveltekit/dist -l 5173
```

dev 서버 — **포트를 분리해 충돌 방지** (둘 다 `/app`·`/wakit` 서빙):

| 실행 | 명령 | 주소 |
|------|------|------|
| SvelteKit 웹 | `cd templates/app_sveltekit/web && npm run dev` | `http://localhost:5180` |
| 앱 (webpack) | `npm run dev:app_sveltekit` | `http://localhost:5173/app/app.html` |
| app_basic | `npm run dev:app_basic` | `http://localhost:5173/app/app.html` |

> webpack 템플릿은 기본 포트 5173 을 공유(5174…로 자동 증가)합니다. SvelteKit 웹 서버는
> **5180** 에 고정해, 어떤 템플릿과 함께 띄워도 `/app` 을 어느 서버가 응답하는지 헷갈리지
> 않습니다. (서로 5173을 잡으면 `/app/app.html` 이 다른 템플릿으로 떠 "렌더링이 이상" 해 보일 수 있음.)

---

## 4. 단일 소스 콘텐츠 (웹·앱이 SvelteKit 페이지 공유)

핵심 기능: **SvelteKit에서 페이지를 한 번 작성해 웹에서도, wakit 앱 안에서도 렌더링.** 공유
화면을 위해 `views/*.html` 을 중복으로 만들지 않습니다.

```
SvelteKit /board/  ── 앱 fetch ──▶  wakit 앱 셸 (app.html)
  <nav data-spa-ignore>      ┐         엔진: extractBodyInnerHTML
  <section class="board">    │ body    → [data-spa-ignore] 제거  (웹 nav/footer 사라짐)
  <footer data-spa-ignore>   ┘         → 본문만 앱 셸에 주입
                                       /app-shared.css 가 스타일 공급
```

엔진의 라우트 로드 방식([wakit.js](../wakit/js/wakit.js)): 라우트의 `file` 을 `fetch` 한 뒤
`extractBodyInnerHTML()` 이 **모든 `[data-spa-ignore]` 요소를 제거**하고 남은 `<body>` 내용을
주입합니다. 공유가 되게 하는 세 가지:

### 4.1 웹 크롬에 `data-spa-ignore` 표시
`web/src/routes/+layout.svelte` 의 웹 `<nav>`·`<footer>` 에 `data-spa-ignore` 를 달면, 앱이
페이지를 fetch할 때 제거돼 **본문만** 앱에 들어옵니다.

### 4.2 공유 스타일은 `web/public/app-shared.css` 에 (Svelte scoped `<style>` 금지)
주입되는 페이지는 **`<head>` 가 버려집니다.** Svelte scoped `<style>`(=`<head>` `<link>` 로 컴파일)은
앱으로 못 따라옵니다. 공유 콘텐츠 스타일은 정적 파일 하나에 두고 **양쪽 셸이 모두 로드**합니다:
- `web/src/app.html` (SvelteKit 웹 셸) → `<link href="%sveltekit.assets%/app-shared.css">`
- `app.html` (wakit 앱 셸) → `<link href="/app-shared.css">`

공유 콘텐츠는 scoped 없는 **일반 클래스명**(`.board`, `.post`)을 씁니다.

### 4.3 `routes[].file` 을 SvelteKit 라우트로 지정
```json
"routes": [
  { "path": "home",   "file": "../views/home.html", "title": "App SvelteKit" },
  { "path": "list",   "file": "../../board/",       "title": "Board" },
  { "path": "detail", "file": "../../board/1/",     "title": "Post" },
  { "path": "profile","file": "../views/profile.html","title": "My" }
]
```
엔진은 `file` 앞에 항상 `./views/` 를 붙입니다(`http(s)://` 만 예외). `/app/app.html` 에 있는
앱 기준으로 **`../../board/` 가 그 prefix를 빠져나와 사이트 루트에 도달** → `/board/`. `trailingSlash:
'always'` 덕분에 `/board/` 는 dev(clean URL)·빌드(`board/index.html`) 모두 동일하게 해석됩니다.

> **섞어 쓸 수 있습니다.** 위에서 `home`/`profile` 은 네이티브 wakit 뷰, `list`/`detail` 은
> SvelteKit에서 옵니다. 네이티브 화면은 자체 `views/css` 유지, 공유 화면은 SvelteKit에서 받음.
> 다른 화면도 `file` 을 해당 라우트로 가리키면 전환됩니다.

---

## 5. 한계 (주의)

- **콘텐츠 내부 링크는 앱에서 풀 네비게이션.** 공유 콘텐츠 안의 `/board/1/` 링크는 실제 URL이라,
  앱에서 누르면 인앱 다이나믹뷰 전환이 아니라 **페이지 전체가 이동**합니다. 두 라우터는 *콘텐츠*를
  공유하지 *링크 의미*를 공유하지 않습니다.
- **`app-shared.css` 는 고정 라이트.** 앱 다크모드를 따르려면 `--sc-*` 변수를 foundation
  토큰(`--color-*`)에 매핑하세요.
- **공유 콘텐츠는 Svelte scoped `<style>` 사용 불가** — `<head>` 에 있어 주입 시 버려집니다.
  `app-shared.css` 를 쓰세요.
- 공유 라우트는 `csr = false` 유지: body가 `<head>` 에서 분리돼 앱에 주입되면 하이드레이션 번들은
  정상 동작하지 않습니다.

---

## 6. 파일 맵 (app_sveltekit/web)

| 파일 | 역할 |
|------|------|
| `svelte.config.js` | adapter-static, `files.assets = 'public'`, 출력 → `../dist` |
| `vite.config.js` | dev `/app`·`/wakit` 미들웨어, 포트 5180 |
| `src/routes/+layout.js` | `prerender` / `csr=false` / `trailingSlash` |
| `src/routes/+layout.svelte` | 웹 크롬(`data-spa-ignore` nav/footer) |
| `src/routes/+page.svelte`, `board/…` | 웹 페이지 = 공유 콘텐츠 |
| `public/app-shared.css` | 공유 콘텐츠 스타일 (양쪽 셸이 로드) |
| `public/app/`, `public/wakit/` | webpack 산출물 (생성됨; gitignore) |

---

다음: [08-web-and-mobile.ko.md](./08-web-and-mobile.ko.md) · [05-template-guide.ko.md](./05-template-guide.ko.md) · [07-backend-integration.ko.md](./07-backend-integration.ko.md)
