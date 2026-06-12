# WAKIT

[English](./README.md) · **한국어**

**웹 코드 한 벌로 UI를 만들어 — 웹사이트로도, PWA로도, 네이티브 앱으로도
배포하세요. 네이티브 같은 화면 전환과 함께.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
![PWA](https://img.shields.io/badge/PWA-ready-5A0FC8.svg)
![Capacitor](https://img.shields.io/badge/Native-Capacitor%20%2F%20Cordova-119EFF.svg)
![Dependencies](https://img.shields.io/badge/runtime%20deps-0-success.svg)

WAKIT은 경량 하이브리드 UI 프레임워크입니다. 한 벌의 HTML / CSS / JS로 만들고,
*동일한* 소스를 세 가지 방식으로 실행합니다:

- 브라우저에서 **일반 웹사이트**로,
- 설치형 **PWA**로 (manifest + service worker 포함),
- WebView 래퍼(Capacitor / Cordova)로 패키징한 **네이티브 앱**으로 — 앱 스토어
  배포까지.

핵심 가치는 "체감"입니다. WAKIT은 평범한 웹 페이지 위에 **네이티브 같은 화면
전환** — 다이나믹 뷰 오버레이 스택을 사용하는 해시 라우팅, 짧은 방향성 애니메이션,
Pull-to-Refresh, iOS 스와이프 백 — 을 얹어, 웹 플랫폼을 벗어나지 않고도 React
Native나 Flutter처럼 느껴지게 만듭니다.

> WAKIT은 **단순한 웹 전용 SPA 프레임워크가 아닙니다.** 하이브리드 *셸*입니다:
> 단일 코드베이스 → 웹 + PWA + 네이티브 패키징 → 진짜 앱처럼 느껴지게.

---

## WAKIT을 쓰는 이유

- **네이티브 같은 화면 전환** — 핵심 차별점. 다이나믹 뷰 오버레이 스택 기반 해시
  라우팅이 짧은 방향성 페이지 전환(Android / iOS 스타일), Pull-to-Refresh, iOS
  스와이프 백을 구동하며 모두 `prefers-reduced-motion`을 존중합니다. 웹 페이지를
  *앱처럼 느껴지게* 만드는 바로 그 요소입니다.
- **하나의 코드베이스, 세 가지 타깃** — 같은 소스가 웹사이트, 설치형 PWA, 스토어
  배포용 네이티브 앱(Capacitor / Cordova)으로 동작합니다.
- **경량 & 메모리 인식** — LRU로 관리되는 다이나믹 뷰, 웜/콜드 탭, 빠른 첫 페인트로
  저사양 기기에서도 전환이 부드럽습니다.
- **테마 내장** — CSS 변수 기반 테마, 라이트/다크 모드, 앱바, 탭바, 오프캔버스
  드로어, 스플래시 화면을 기본 제공합니다.
- **템플릿 기반** — 각 프로젝트는 독립적인 템플릿으로 존재하며, 생성·빌드·패키징
  스크립트를 함께 제공합니다.

---

## 동작 방식

WAKIT은 두 가지 모드 중 하나로 자동 동작합니다:

| 모드           | 조건                                   | 스크립트            | 기능                                                                |
| -------------- | -------------------------------------- | ------------------ | ------------------------------------------------------------------- |
| **SPA**        | `window.Core` 존재 (`Core.initApp`)    | `wakit.js`         | 전체 엔진: 라우팅, 탭, 다이나믹 뷰, PTR, 오프캔버스, 테마           |
| **SSR/정적**   | `window.Core` 없음                     | `wakit-bridge.js`  | 경량: `<base>` 주입, pretty URL, `data-include` 파셜                |

### 코어 파일

| 파일                 | 역할                                                                                          |
| ------------------- | --------------------------------------------------------------------------------------------- |
| `js/wakit.js`       | SPA 코어 — 설정 로드, 앱 셸 렌더링, 탭/라우터, 다이나믹 뷰, PTR, 오프캔버스, 링크 가로채기      |
| `js/wakit-bridge.js`| SSR 브릿지 — `<base>` 주입, `/views/foo` → `/views/foo.html`, `data-include` 처리             |
| `wakitConfig.json`  | 앱 설정 — 탭, 라우트, `webNav`(웹 헤더 메뉴), 스플래시, PTR, 테마, 탭바 옵션                    |
| `css/wakit.css`     | 기본 리셋, CSS 변수, 앱바 / 탭바 / 뷰 / 오프캔버스 / PTR / 스플래시 / 다크모드 스타일          |

### 라우팅 요약

- **진입점** — `location.hash` 변경이 `onHashChange()`를 트리거합니다.
- **탭 페이지** — 설정의 `tabs[].page`와 매칭 → 해당 뷰 활성화.
- **비탭 라우트** — `routes[].path`와 매칭 → 라우트의 HTML을 fetch해 다이나믹
  (오버레이) 뷰로 표시.
- **외부 URL** — 보안 설정이 허용할 때만 (`security.allowExternalRoutes` 또는
  `security.allowedOrigins`).

> **SPA/모바일** 화면 이동은 반드시 `<a href="#routeName">`을 사용하며, 라우트는
> `wakitConfig.json`의 `tabs` 또는 `routes`에 등록해야 합니다.
>
> **웹** 네비게이션은 다릅니다. 상단 헤더는 **파일에 직접 링크**
> (`<a href="views/foo.html">`)하며, 별도의 `webNav` 설정으로 구동됩니다 —
> `routes`를 타지 않습니다. 덕분에 웹 메뉴와 모바일 탭바는 같은 뷰 파일을
> 공유하면서도 구성을 독립적으로 가질 수 있습니다(예: 웹 6개 vs 모바일 탭 4개).

---

## 프로젝트 구조

```
wakit/                  ← SPA 엔진 (이 패키지)
├── js/                 ← wakit.js (코어), wakit-bridge.js (SSR)
├── css/                ← wakit.css 및 컴포넌트 스타일
├── assets/             ← 아이콘, 버튼, 소셜 로그인 마크
├── manifest.json       ← PWA manifest
└── service-worker.js

templates/{name}/       ← 템플릿당 독립적인 앱 하나
├── app.html            ← SPA 진입점
├── wakitConfig.json    ← 탭 / 라우트 / 테마 설정
├── views/              ← 라우트별 뷰 HTML
├── css/ · js/          ← 뷰별 스타일과 스크립트
├── wakit-components/   ← appbar / tabbar / appheader / splash
├── manifest.json       ← PWA 설정
└── web/                ← Astro 웹 레이어 (랜딩 페이지, SEO)

supabase/               ← 로컬 개발 환경 + 마이그레이션
scripts/                ← 템플릿 생성 / 삭제 / 패키징 자동화
docs/                   ← 상세 문서 (01–06)
```

`app_basic`이 골든 base입니다 — `create:template`/`scaffold:template`이 이 템플릿을 복사합니다.
`app_astro`는 Astro 웹 레이어를 포함한 참고 템플릿입니다.

---

## 시작하기

```bash
npm install

# webpack 개발 서버에서 템플릿 실행
npm run dev:app_astro       # → http://localhost:5173/app/app.html

# 해당 템플릿의 Astro 웹 레이어 실행
cd templates/app_astro/web && npm run dev   # → http://localhost:4321
```

사용 가능한 템플릿: `app_astro`, `app_basic`.

### 빌드

```bash
npm run build:app_astro     # webpack (난독화 + 복사) → astro build → dist/
npm run preview            # 빌드된 dist/를 서빙해 확인
```

빌드 파이프라인:

```
npm run build:{name}
  → webpack: wakit.js 난독화      → templates/{name}/web/public/wakit/
  → webpack: 앱 파일 복사         → templates/{name}/web/public/app/  (dist/, web/ 제외)
  → astro build                   → templates/{name}/dist/   (배포 결과물)
```

### 패키징 (배포용)

```bash
npm run package:app_astro
# → packages/hybrid-ui-template-app_astro-v1.0.0.zip
#    ├── dist/             ← 웹 서버에 올릴 빌드 파일
#    └── supabase/setup.sql ← DB 스키마 (템플릿 범위 마이그레이션)
```

---

## 템플릿 자동화

```bash
npm run create:template    # 폴더 복사 + npm install + npm 스크립트 등록
npm run delete:template    # 폴더 삭제 + npm 스크립트 제거
```

템플릿을 생성하거나 삭제하면 해당 `dev:{name}`, `build:{name}`,
`package:{name}` 스크립트가 `package.json`에 자동 등록/제거됩니다.

---

## Supabase 연동

템플릿은 인증과 데이터를 위해 Supabase를 연결할 수 있습니다:

```js
// app.html
window.sb = supabase.createClient(
  'http://127.0.0.1:54321',
  'sb_publishable_...'
);
```

- 인증은 `window.sb.auth.signUp()` / `signInWithPassword()`로.
- 각 템플릿은 자체 스키마를 사용합니다 (예: `app_astro.profiles`).
- RLS에는 `raw_user_meta_data`가 아닌 `app_metadata`를 사용하세요.

---

## 전역 API (SPA)

- `window.Core.initApp(configPath)` — 앱 셸 초기화.
- `window.goBackWithAnimation()` — 프로그래매틱 백 (다이나믹 뷰가 열려 있으면
  닫고, 없으면 `history.back()`).
- `window.openOffcanvas('left' | 'right')` / `window.closeOffcanvas()`.

---

## 문서

상세 가이드는 [`docs/`](./docs)에 있습니다:

1. `01-overview.md` — 개념과 SPA 초기화 흐름
2. `02-wakitConfig.md` — 설정 스키마
3. `03-bridge-and-attributes.md` — SSR 브릿지와 data 속성
4. `04-wakit-css.md` — 스타일링과 CSS 변수
5. `05-template-guide.md` — 템플릿 만들기
6. `06-design-guide.md` — 디자인 가이드라인
7. `07-backend-integration.md` — 백엔드 연동 & 에이전트 가이드
8. `08-web-and-mobile.md` — 한 코드 → PC는 웹 / 모바일은 앱 (규칙)

---

## 라이선스

[MIT License](./LICENSE)로 배포됩니다. © 2026 wakit-io.
