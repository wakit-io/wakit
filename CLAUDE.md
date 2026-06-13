# Hybrid UI Framework — Claude 컨텍스트

## 프로젝트 개요

**wakit** 기반의 하이브리드 웹앱 프레임워크. 한 벌의 HTML/CSS/JS로 웹과 앱(Capacitor 패키징)을 동시에 제공하는 구조.

**핵심 구성:**
- `wakit/` — SPA 엔진 (라우팅, 탭, 트랜지션, 테마, 다크모드)
- `templates/` — 프로젝트 단위 템플릿 (각각 독립적인 앱)
- `supabase/` — Supabase 로컬 개발 환경 + 마이그레이션

---

## 템플릿 구조 (templates/{name}/)

```
templates/{name}/
├── app.html              ← wakit SPA 진입점 (Supabase CDN 로드, window.sb 초기화)
├── wakitConfig.json      ← 탭·라우트·테마 설정
├── views/                ← 뷰 HTML 파일 (라우트별)
├── css/                  ← 뷰별 CSS
├── js/                   ← theme-toggle.js 등
├── wakit-components/     ← appbar.html, tabbar.html, appheader.html, splash.html
├── manifest.json         ← PWA 설정
└── web/                  ← Astro 웹 레이어 (랜딩페이지, SEO)
    ├── src/pages/        ← Astro 페이지 (/, /board 등)
    ├── public/           ← 빌드 시 자동 채워짐 (건드리지 말 것)
    ├── astro.config.mjs  ← compressHTML: false, vite 미들웨어 (dev 시 /app, /wakit 서빙)
    └── dist/             ← 최종 빌드 결과물
```

**골든 base 템플릿:** `app_basic` — `create:template`/`scaffold:template`이 이 템플릿을 복사함 (`app_astro`는 Astro 웹 레이어 포함 참고 템플릿)

---

## 빌드 파이프라인

> **모든 템플릿은 제네릭 러너 `scripts/wakit.js`로 실행한다** (per-template package.json 스크립트 없음 → package.json 안 더러워짐). `node scripts/wakit.js <web|dev|build|package|list> <name>` / npm 별칭 `npm run wakit -- <cmd> <name>`. 캐논 템플릿(app_basic/astro/sveltekit)은 단축 스크립트(`dev:app_*` 등)도 유지.

```
node scripts/wakit.js build {name}
    ↓
webpack: wakit.js 난독화 → templates/{name}/web/public/wakit/
webpack: 앱 파일 복사   → templates/{name}/web/public/app/  (dist/, web/ 제외)
    ↓
web/ 있으면 npm run build (astro/svelte build) → templates/{name}/dist/  (배포 결과물)
```

**패키징 (판매용 ZIP):**
```
node scripts/wakit.js package {name}
→ packages/hybrid-ui-template-{name}-v1.0.0.zip
  ├── dist/           ← 웹 서버에 올릴 빌드 파일
  └── supabase/setup.sql ← DB 스키마 (템플릿명 포함된 마이그레이션 자동 수집)
```

---

## 개발 서버

```bash
node scripts/wakit.js web {name}   # web 레이어 dev 서버 (/app·/wakit 도 서빙)
node scripts/wakit.js dev {name}   # webpack 앱 dev — http://localhost:5173/app/app.html
```

---

## 템플릿 관리 자동화

```bash
npm run create:template   # 생성: 폴더 복사 + 리브랜딩 + (web/ 있으면) npm install. package.json은 안 건드림
npm run delete:template   # 삭제: 폴더 삭제
```

새 템플릿은 **package.json에 스크립트를 등록하지 않는다.** 실행은 `scripts/wakit.js` 러너로. (`--base`로 베이스 선택: docs/05-template-guide §9.5)

---

## 핵심 규칙 (코딩 시 반드시 지킬 것)

> ### 🔒 필수 규칙 (MUST — 어기면 조용히 깨짐)
> app_basic = 기본 스타터 구조. 새 템플릿/뷰는 **아래를 반드시** 따른다.
>
> 1. **`app.html`(SPA 셸)은 `css/foundation/index.css`(색 토큰)를 반드시 로드.** 안 하면 SPA 뷰에서 `--color-*`가 전부 미정의 → **모바일에서 색 전부 사라짐**. (뷰의 토큰 링크는 `data-spa-ignore`라 SPA에서 제거되므로 셸이 책임진다.)
> 2. **색은 foundation 토큰(`--color-*`)만 사용** — 하드코딩 금지(다크모드 깨짐). 뷰 CSS에서 토큰을 쓰되 별도 `@import`는 불필요(셸이 로드).
> 3. **화면 전용 CSS = `<body>` 안 + `data-spa-ignore` 없음.** head + data-spa-ignore면 SPA에서 제거돼 스타일 깨짐.
> 4. **공용 리소스(wakit.css·foundation·style.css·theme-init)와 header/footer include = `data-spa-ignore`.** (SPA는 엔진이 앱바/탭바를 렌더하므로 웹 헤더/푸터 제외.)
> 5. **테마 키 = `'blog-theme'`** (엔진 `applyBlogThemeSync`와 동일). 다른 키 쓰면 토글이 themechange로 즉시 되돌려짐.
> 6. **SPA 이동 = `<a href="#route">`(해시) / 웹 이동 = `webNav` 파일 링크(`views/foo.html`).** 섞으면 깨짐.
> 7. **독립 뷰 = 풀 HTML 문서**(index.html에 임베드되는 home만 조각), `<main>`에 `container`, 반응형은 **미디어쿼리**(모드 클래스는 SPA 전용).
> 8. **PC=웹사이트 / 모바일=앱 → `theme.isMobile: false`.** (데스크톱도 앱 UI로 강제할 때만 true.)
> 9. **🔒 동적 앱(로그인·DB)의 wakit `/app` 화면은 반드시 "네이티브 뷰"(일반 HTML + 일반 `<script>` + `window.sb`)로 만든다.** wakit은 HTML을 fetch해 주입 + 일반 스크립트만 실행하므로 **csr SvelteKit/Svelte 컴포넌트는 앱 셸에서 렌더 안 됨**. 웹(SvelteKit)과 앱(wakit)은 라우팅이 따로 돈다. 파라미터는 `sessionStorage`+평문 `#route`(쿼리 hash 금지), 인증 전환 후 `location.reload()`. **상세·필수: docs/10-wakit-native-app**
>
> 상세: docs/05-template-guide(§2.1·6.2·6.3) · docs/08-web-and-mobile · docs/10-wakit-native-app

### wakit 라우팅
- 페이지 이동은 반드시 `<a href="#routeName">` — `<button>` + JS navigate() 작동 안 함
- 라우트는 `wakitConfig.json`의 `tabs` 또는 `routes`에 등록해야 함
- **웹 헤더 메뉴는 별개** — `wakitConfig.json`의 `webNav`로 정의. 웹 모드는 해시 라우트가 아니라 `<a href="views/foo.html">` 파일 직접 링크를 사용하며 `routes`를 타지 않음. `webNav`(웹)와 `tabs`(모바일)는 구성이 달라도 됨. 헤더는 `header.html`의 `getNavData()`가 wakitConfig를 fetch해 렌더링

### wakit 스크립트
- views 내 `<script type="module">` 실행 불안정 — 반드시 일반 `<script>` 사용
- Supabase는 `app.html`에서 UMD CDN으로 로드 → `window.sb`로 전역 사용

### Supabase
- 로컬: `http://127.0.0.1:54321`, publishable key는 `supabase status`로 확인
- `raw_user_meta_data`는 RLS에 사용 금지 → `app_metadata` 사용
- 각 템플릿은 별도 스키마 사용 (예: `app_test.profiles`)

### webpack CopyWebpackPlugin
- `to` 경로는 반드시 `path.resolve(__dirname, ...)` 절대경로 사용
- 템플릿 파일 복사 시 `dist/**`, `web/**` 제외 필수

### CSS
- **화면 전용 CSS는 `<body>` 안에 `data-spa-ignore` 없이** 넣어야 함 (head에 data-spa-ignore로 넣으면 모바일/SPA에서 제거돼 스타일 깨짐). 공용 CSS(wakit.css·foundation·style.css 등)는 `<head>` + `data-spa-ignore`. 상세: docs/05-template-guide 6.2
- `appbarView: false` → `html.no-appbar` 클래스 적용됨
- safe-area는 `padding-top: env(safe-area-inset-top)` 방식 사용

---

## Supabase 연동 구조 (app_test 기준)

```javascript
// app.html
window.sb = supabase.createClient(
  'http://127.0.0.1:54321',
  'sb_publishable_...'
);
```

- Auth: `window.sb.auth.signUp()`, `window.sb.auth.signInWithPassword()`
- 회원가입 시 `app_test.handle_new_user()` 트리거로 profiles 자동 생성
- 스키마: `app_test.profiles` (id, username, email, created_at)

---

## 새 앱 생성 시 필요한 인풋

새 템플릿/앱 생성 요청 시 아래 정보를 받아 진행:
1. 앱 이름 (영문, 예: app_shop)
2. 브랜드 색상
3. 탭 메뉴 구성 (탭명, 아이콘, 페이지)
4. 뷰 목록 + 각 뷰 설명
5. Supabase 스키마 (테이블 구조) — 선택
6. 비즈니스 로직 설명 — 선택

---

## 주요 파일 위치

| 파일 | 역할 |
|------|------|
| `wakit/js/wakit.js` | SPA 코어 엔진 |
| `wakit/css/wakit.css` | 기본 스타일 |
| `webpack.config.js` | 빌드 설정 (난독화 + 복사) |
| `scripts/create-template.js` | 템플릿 생성 자동화 |
| `scripts/delete-template.js` | 템플릿 삭제 자동화 |
| `scripts/package-template.js` | 패키징 ZIP 자동화 |
| `docs/` | 상세 문서 (01~05) |
| `supabase/migrations/` | DB 스키마 마이그레이션 |

---

## 판매/배포 방식

- **프론트 템플릿 방식**: `dist/`만 납품, 구매자가 백엔드 직접 연동
- **Supabase 연동 버전**: `dist/` + `supabase/setup.sql` 납품, URL/Key만 교체하면 동작
- **SaaS/화이트라벨**: 서버에서 템플릿별 서브도메인 제공 + 구독료 수취 구조 가능
