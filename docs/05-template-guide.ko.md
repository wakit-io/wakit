# 새 템플릿 제작 가이드

[English](./05-template-guide.md) · **한국어**

`app_basic` 템플릿을 기준으로 한 새 템플릿 제작 방법입니다.

---

## 1. 폴더 구조

```
templates/my-template/
├── index.html                  # 웹용 진입점 (SSR/정적 서버)
├── app.html                    # 앱/SPA 진입점 (Capacitor 패키징, PWA)
├── wakitConfig.json            # 탭·라우트·테마 설정
├── manifest.json               # PWA 매니페스트
├── css/
│   ├── foundation/             # 디자인 토큰 (CSS 변수)
│   │   ├── index.css           # 전체 import 진입점
│   │   ├── color.css           # 색상 토큰
│   │   ├── spacing.css         # 간격 토큰
│   │   ├── typography.css      # 타이포그래피 토큰
│   │   ├── effect.css          # 그림자·효과 토큰
│   │   ├── layout.css          # 레이아웃 토큰
│   │   ├── icons.css           # 아이콘 토큰
│   │   ├── graphic.css         # 그래픽 토큰
│   │   ├── buttons.css         # 버튼 토큰
│   │   └── badge.css           # 뱃지 토큰
│   ├── style.css               # 공통 레이아웃·컴포넌트 스타일
│   └── [화면명].css             # 화면별 CSS (ex: home.css, detail.css)
├── js/
│   ├── theme-init.js           # FOUC 방지용 초기 테마 설정 (head에 로드)
│   ├── theme-toggle.js         # 라이트/다크 토글 기능
│   ├── header.js               # 헤더 스크롤·상태 관리
│   └── scroll-to-top.js        # 상단 스크롤 버튼
├── views/                      # 화면별 HTML (탭·라우트 콘텐츠)
│   ├── home.html
│   └── [화면명].html
└── wakit-components/           # WAKIT 셸 컴포넌트
    ├── appbar.html             # 상단 앱바 (모바일 전용)
    ├── appheader.html          # 다이나믹 뷰 내부 헤더
    ├── tabbar.html             # 하단 탭바
    ├── splash.html             # 스플래시 화면
    ├── offcanvas-left.html     # 왼쪽 사이드 메뉴
    └── offcanvas-right.html    # 오른쪽 사이드 메뉴
```

---

## 2. 진입점 파일

### 2.1 app.html — SPA 진입점 (앱·PWA)

Capacitor/Cordova 패키징, PWA 홈 화면 추가, 개발 서버(`npm run dev`) 실행 시 사용됩니다.
WAKIT 코어(`wakit.js`)를 ES 모듈로 로드하고 `Core.initApp()`을 호출합니다.

```html
<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1,
        maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover">
  <title>My Template</title>

  <!-- iOS PWA 설정 -->
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="msapplication-tap-highlight" content="no">

  <!-- PWA 매니페스트 -->
  <link rel="manifest" href="./manifest.json">
  <meta name="theme-color" content="#ffffff">

  <!-- 아이콘 라이브러리 (필요한 것만 선택) -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn-uicons.flaticon.com/2.1.0/uicons-solid-rounded/css/uicons-solid-rounded.css">
  <link rel="stylesheet" href="https://cdn-uicons.flaticon.com/2.1.0/uicons-regular-rounded/css/uicons-regular-rounded.css">

  <!-- WAKIT 기본 스타일 -->
  <link rel="stylesheet" href="/wakit/css/wakit.css">
  <link rel="stylesheet" href="/wakit/css/styleGuide.css">
  <link rel="stylesheet" href="/wakit/css/component.css">
  <link rel="stylesheet" href="/wakit/css/wakit-popup.css">

  <!-- 템플릿 디자인 토큰 + 공통 스타일 -->
  <link rel="stylesheet" href="./css/foundation/index.css">
  <link rel="stylesheet" href="./css/style.css">

  <!-- FOUC 방지: 테마 초기값 설정 (head 최하단에 위치) -->
  <script src="./js/theme-init.js"></script>
</head>
<body id="root">
  <script type="module">
    import Core from "/wakit/js/wakit.js";
    Core.initApp('./wakitConfig.json');

    // 로컬 개발 중에는 SW 등록 생략 (캐시로 인한 라이브 리로드 방해 방지)
    const isLocalDev = ['localhost', '127.0.0.1'].includes(location.hostname);
    if ('serviceWorker' in navigator && !isLocalDev) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/wakit/service-worker.js');
      });
    }
  </script>
  <script src="/wakit/js/wakit-popup.js"></script>
  <script>window.Popup && Popup.init();</script>
</body>
</html>
```

### 2.2 index.html — 웹 진입점 (SSR·정적 서버)

일반 웹 브라우저 접근 시 사용됩니다. `wakit-bridge.js`를 로드해 `data-include` 파셜 처리·base 주입 등을 담당합니다.
SPA 기능(탭, 다이나믹 뷰)은 동작하지 않으며, SEO·공유 링크 대응용 정적 뷰 역할을 합니다.

```html
<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1,
        maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover">
  <title>My Template</title>
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="msapplication-tap-highlight" content="no">
  <link rel="manifest" href="./manifest.json">
  <meta name="theme-color" content="#ffffff">

  <!-- bridge는 반드시 data-spa-ignore (SPA 환경에서 실행 방지) -->
  <script src="../../../wakit/js/wakit-bridge.js" data-spa-ignore></script>

  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css"
        rel="stylesheet" data-spa-ignore>
  <link rel="stylesheet" href="../../../wakit/css/wakit.css" data-spa-ignore>
  <link rel="stylesheet" href="../../../wakit/css/styleGuide.css" data-spa-ignore>
  <link rel="stylesheet" href="../../../wakit/css/component.css" data-spa-ignore>
  <link rel="stylesheet" href="css/foundation/index.css" data-spa-ignore>
  <link rel="stylesheet" href="css/style.css" data-spa-ignore>
  <script src="js/theme-init.js" data-spa-ignore></script>
</head>
<body>
  <!-- data-include로 파셜을 SSR 방식으로 포함 -->
  <div data-include="wakit-components/header.html"></div>
  <div data-include="views/home.html"></div>
  <div data-include="wakit-components/footer.html"></div>
</body>
<script src="../../../wakit/js/wakit-popup.js" data-spa-ignore></script>
<script src="js/theme-toggle.js" data-spa-ignore></script>
<script src="js/header.js" data-spa-ignore></script>
<script src="js/scroll-to-top.js" data-spa-ignore></script>
<script data-spa-ignore>if (typeof Popup !== 'undefined') Popup.init();</script>
</html>
```

> **`data-spa-ignore` 규칙**: index.html의 `<link>`, `<script>` 태그에는 반드시 `data-spa-ignore`를 붙입니다. SPA 환경(`app.html`)에서 이 파일이 뷰로 로드될 때 중복 실행을 막기 위함입니다.

---

## 3. wakitConfig.json

탭·라우트·테마를 선언합니다. 탭과 라우트의 `page`/`path`는 반드시 1:1로 일치해야 합니다.

```json
{
  "splashDelay": 100,
  "splashForce": false,
  "tabbar": {
    "autoHide": false,
    "hideThreshold": 14,
    "displayMode": "always"
  },
  "pullToRefresh": {
    "threshold": 90,
    "startSlop": 18,
    "damping": 0.35,
    "maxPull": 200
  },
  "theme": {
    "primaryColor": "#006fff",
    "font": "Pretendard, system-ui",
    "isMobile": true
  },
  "defaultTab": "home",
  "tabs": [
    { "id": "home",    "label": "홈",  "icon": "fi fi-sr-home",  "page": "home" },
    { "id": "my",      "label": "My",  "icon": "fi fi-sr-user",  "page": "my" }
  ],
  "routes": [
    { "path": "home",   "file": "../views/home.html",   "title": "홈" },
    { "path": "my",     "file": "../views/my.html",     "title": "My" },
    { "path": "detail", "file": "../views/detail.html", "title": "상세" }
  ],
  "webNav": {
    "brand": { "label": "My App", "logo": "✦", "href": "index.html" },
    "items": [
      { "label": "홈",   "href": "index.html" },
      { "label": "상세", "href": "views/detail.html" }
    ],
    "cta": { "label": "시작하기", "href": "views/my.html" }
  }
}
```

**규칙**
- `tabs[].page`와 `routes[].path`가 동일한 탭 페이지는 탭 전환 시 해당 뷰를 활성화합니다.
- `routes`에만 있는 경로(예: `detail`)는 다이나믹 뷰(오버레이)로 열립니다.
- `routes[].file` 경로는 `THEME_BASE`(wakitConfig.json이 있는 폴더) 기준 상대 경로입니다.
- `theme.isMobile: true`로 설정하면 데스크톱에서도 모바일 UI(앱바·탭바·PTR)가 활성화됩니다.
- `webNav`는 **웹 헤더 메뉴**(`wakit-components/header.html`)를 정의합니다. 모바일 `tabs`/`routes`와 별개이며, `items[].href`는 해시 라우트가 아니라 **파일 경로**(테마 루트 기준)로 직접 링크합니다. 웹/모바일 메뉴 구성을 다르게 가져갈 수 있습니다. 자세한 내용은 [02-wakitConfig.md](./02-wakitConfig.ko.md#35-webnav-웹-헤더-메뉴) 참고.

---

## 4. manifest.json

PWA 홈 화면 추가·스플래시 등에 사용됩니다. `start_url`은 반드시 `app.html`로 지정합니다.

```json
{
  "name": "My Template",
  "short_name": "My Template",
  "start_url": "app.html",
  "lang": "ko-KR",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#ffffff",
  "orientation": "portrait"
}
```

---

## 5. wakit-components/

WAKIT 코어가 초기화 시 자동으로 fetch해 셸에 삽입하는 HTML 조각들입니다.

### 5.1 appbar.html — 상단 앱바 (모바일 전용)

```html
<header class="appbar">
  <!-- 메인 탭에서만 표시되는 브랜드 로고 (코어가 자동 토글) -->
  <a class="brand" id="appbar-brand" href="#" aria-hidden="true" style="display:none">
    <span class="brand-name">My App</span>
  </a>

  <!-- 브랜드가 숨겨질 때 표시되는 페이지 타이틀 -->
  <div class="title" id="appbar-title">My App</div>

  <!-- 우측 메뉴 버튼 (필요 시 활성화) -->
  <!-- <div class="appbar-right">
    <button id="btn-menu-right" aria-label="open right menu">☰</button>
  </div> -->
</header>
```

**필수 id**: `appbar-brand`, `appbar-title` — 코어가 탭 전환 시 자동으로 표시/숨김을 제어합니다.

### 5.2 appheader.html — 다이나믹 뷰 내부 헤더

다이나믹 뷰(오버레이 페이지)의 상단에 삽입됩니다. 뒤로가기 버튼과 타이틀 영역이 필수입니다.

```html
<button class="btn-dv-back" aria-label="back"
  onclick="(window.goBackWithAnimation ? window.goBackWithAnimation() : history.back())">←</button>
<div class="title dv-title"></div>
```

**필수 클래스**: `btn-dv-back`(뒤로가기), `dv-title`(페이지 타이틀 — 코어가 자동으로 텍스트 주입).

### 5.3 tabbar.html — 하단 탭바

`wakitConfig.json`의 `tabs` 배열과 1:1로 일치해야 합니다.

```html
<nav class="tabbar" id="tabbar">
  <!-- id="tab-{tabs[].id}", href="#{tabs[].page}" -->
  <a id="tab-home" href="#home" data-id="home" aria-label="홈" class="active">
    <div class="icon"><span class="fi fi-sr-home"></span></div>
    <span>홈</span>
  </a>
  <a id="tab-my" href="#my" data-id="my" aria-label="My">
    <div class="icon"><span class="fi fi-sr-user"></span></div>
    <span>My</span>
  </a>
</nav>
```

**규칙**
- `id="tab-{tabs[].id}"` 형식을 반드시 지킵니다.
- `href="#{tabs[].page}"` — 탭 클릭 시 해시 라우터가 해당 뷰를 활성화합니다.
- `data-id="{tabs[].id}"` — 코어가 활성 탭 판별에 사용합니다.
- 기본 활성 탭(defaultTab)에 `class="active"`를 붙입니다.

### 5.4 splash.html — 스플래시 화면

앱 로딩 중 전체 화면으로 표시됩니다. 배경·로고·스피너를 자유롭게 구성합니다.

```html
<div style="width:100%;height:100%;display:flex;align-items:center;flex-direction:column;
            justify-content:center;background:#ffffff;z-index:10000">
  <div style="font-size:24px;font-weight:bold;color:#000;margin-bottom:20px;">
    MY APP
  </div>
  <div class="spinner"
       style="width:36px;height:36px;border-radius:50%;
              border:3px solid rgba(0,0,0,.15);
              border-top-color:rgba(0,0,0,.6);
              animation:spin .8s linear infinite">
  </div>
</div>
```

### 5.5 offcanvas-left.html / offcanvas-right.html — 사이드 메뉴

앱바의 메뉴 버튼 클릭 시 열리는 슬라이드 패널입니다.

```html
<!-- offcanvas-left.html -->
<div style="padding:16px">
  <h3>메뉴</h3>
  <nav>
    <a href="#home">홈</a>
    <a href="#my">마이페이지</a>
  </nav>
</div>
```

---

## 6. views/ — 화면 HTML

각 화면(탭·라우트)의 콘텐츠입니다. 화면별 CSS는 파일 상단에 `<link>` 태그로 선언합니다.

```html
<!-- views/home.html -->
<link rel="stylesheet" href="./css/home.css">

<main class="home-page" role="main">
  <section class="home-hero">
    <h1>환영합니다</h1>
    <p>앱 설명 텍스트</p>
  </section>

  <!-- 다이나믹 뷰로 이동하는 링크 -->
  <a href="#detail">상세 보기</a>
</main>
```

**규칙**
- 화면 최상위 요소에 `role="main"` 권장.
- 화면 전용 CSS는 `<link rel="stylesheet" href="./css/[화면명].css">` 로 선언하되, **`<body>` 안에 `data-spa-ignore` 없이** 넣습니다(아래 6.2 참고). 코어가 다이나믹 뷰 닫힐 때 자동으로 해당 CSS를 제거합니다.
- `href="#[path]"` 링크는 탭 전환 또는 다이나믹 뷰 진입으로 처리됩니다.
- `data-spa-ignore` 없이 `<script>` 작성 — 뷰가 로드될 때마다 실행됩니다. 한 번만 실행해야 한다면 `data-once` 속성을 추가합니다.

### ⚠️ 6.1 뷰 내 CSS 경로 — 반드시 읽어야 할 주의사항

wakit SPA는 뷰 파일을 fetch해서 DOM에 동적으로 주입합니다. 이때 `<link>` 태그의 경로는 **view 파일 위치가 아닌 `app.html` 위치를 기준**으로 해석됩니다.

```
templates/my-template/
├── app.html          ← 경로 기준점
├── css/
│   └── home.css
└── views/
    └── home.html     ← 이 파일 안의 <link> 경로도 app.html 기준
```

```html
<!-- ❌ 틀림 — view 파일 기준 상대경로 (CSS 로드 안됨) -->
<link rel="stylesheet" href="../css/home.css">

<!-- ✅ 맞음 — app.html 기준 상대경로 -->
<link rel="stylesheet" href="./css/home.css">
```

이미지, JS 등 뷰 내부의 모든 리소스 경로도 동일한 규칙이 적용됩니다.

### ⚠️ 6.2 화면 전용 CSS는 `<body>` 안에, `data-spa-ignore` 없이

화면(뷰) 전용 CSS의 `<link>`는 **`<head>`가 아니라 `<body>` 안에**, 그리고 **`data-spa-ignore` 없이** 선언해야 합니다. 그래야 웹과 모바일(SPA) 양쪽에서 스타일이 적용됩니다.

```html
<head>
  <!-- 공용 리소스: head + data-spa-ignore (app.html이 이미 로드하므로 중복 방지) -->
  <link rel="stylesheet" href="css/foundation/index.css" data-spa-ignore>
  <link rel="stylesheet" href="css/style.css" data-spa-ignore>
</head>
<body>
  <!-- ✅ 화면 전용 CSS: body 안, data-spa-ignore 없음 -->
  <link rel="stylesheet" href="css/login.css">

  <div data-include="wakit-components/header.html"></div>
  <main class="login-page"> ... </main>
</body>
```

**이유**
- `data-spa-ignore`가 붙은 `link`/`style`은 SPA 주입 시 **제거**됩니다([03-bridge-and-attributes.ko.md](./03-bridge-and-attributes.ko.md) 참고). 따라서 화면 전용 CSS를 `<head>`에 `data-spa-ignore`로 넣으면 **모바일/SPA에서 그 화면 스타일이 빠져 깨집니다.**
- 반대로 `<body>` 안에 `data-spa-ignore` 없이 두면:
  - **웹(Bridge) 모드** — 일반 스타일시트로 그대로 적용
  - **모바일(SPA) 모드** — 뷰가 다이나믹 뷰로 주입될 때 코어가 이 `<link>`를 head로 올려 적용하고(다이나믹 뷰용으로 태깅), **뷰가 닫히면 자동 제거**(CSS 격리, [04-wakit-css.ko.md](./04-wakit-css.ko.md) 참고)
- 정리: **공용 CSS = `<head>` + `data-spa-ignore`**, **화면 전용 CSS = `<body>` + `data-spa-ignore` 없음**.

---

### ⚠️ 6.3 웹 페이지 구조 — 풀 문서 · 공통 컴포넌트 · 컨테이너

URL로 직접 접근하는 뷰(웹 모드 페이지)는 조각이 아니라 **풀 HTML 문서**로 작성합니다. (`index.html`에 임베드되는 기본 뷰 `home.html`만 조각 예외.)

```html
<!doctype html><html lang="ko">
<head>
  <!-- 공용 리소스: data-spa-ignore (app.html이 이미 로드 → SPA 중복 방지) -->
  <link rel="stylesheet" href="css/foundation/index.css" data-spa-ignore>
  <link rel="stylesheet" href="css/style.css" data-spa-ignore>
  <script src="js/theme-init.js" data-spa-ignore></script>
</head>
<body>
  <!-- 공통 컴포넌트 include: data-spa-ignore (SPA에선 엔진이 앱바/탭바 렌더) -->
  <div data-include="wakit-components/header.html" data-spa-ignore></div>

  <!-- 화면 전용 CSS: body 안, data-spa-ignore 없음 (6.2) -->
  <link rel="stylesheet" href="css/{화면}.css">

  <main class="{화면} container">…</main>

  <div data-include="wakit-components/footer.html" data-spa-ignore></div>
</body>
<script src="js/theme-toggle.js" data-spa-ignore></script>
</html>
```

**규칙**
- **공통 컴포넌트 include(header/footer)에는 `data-spa-ignore`** — SPA에선 엔진이 앱바·탭바를 렌더하므로 웹 헤더/푸터는 제외합니다.
- **`<main>`에 `container` 클래스** — 웹(데스크톱)에서 가로폭을 가운데로 제한합니다.

**sticky 헤더** — 헤더는 `data-include` 래퍼 `<div>` 안에 주입됩니다. `position: sticky`는 그 래퍼 박스(= 헤더 높이) 안에서만 작동해 스크롤 시 바로 사라집니다. 래퍼 박스를 제거해야 페이지 기준으로 고정됩니다:

```css
[data-include="wakit-components/header.html"] { display: contents; }
.site-header { position: sticky; top: 0; z-index: 50; }
```

---

## 7. css/foundation/ — 디자인 토큰

Figma 디자인 토큰을 CSS 변수로 관리합니다. `index.css`가 전체를 묶어서 import합니다.

```css
/* foundation/index.css */
@import './color.css';
@import './spacing.css';
@import './typography.css';
@import './effect.css';
@import './layout.css';
@import './icons.css';
@import './graphic.css';
@import './buttons.css';
@import './badge.css';
```

`color.css`에서 라이트·다크 모드를 함께 정의합니다.

```css
/* foundation/color.css */
:root {
  --color-primary: #3b82f6;
  --color-bg-primary: #ffffff;
  --color-text-primary: #17191a;
  /* ... */
}

[data-theme="dark"] {
  --color-primary: #60a5fa;
  --color-bg-primary: #121212;
  --color-text-primary: #ffffff;
  /* ... */
}
```

---

## 8. js/ — 스크립트

### ⚠️ 8.0 테마 지속성 — 반드시 읽어야 할 주의사항

wakit.js는 `initApp()` 내부에서 `applyBlogThemeSync()`를 호출합니다. 이 함수는 **`'blog-theme'`** 키를 localStorage에서 읽어 테마를 결정합니다. 키가 없거나 값이 `'light'`면 `removeAttribute('data-theme')`를 실행해 **기존에 설정된 다크 모드를 강제로 해제**합니다.

결과적으로, 커스텀 템플릿에서 자체 localStorage 키(예: `'app_test-theme'`)로만 테마를 저장하면 앱 재시작 시 wakit이 덮어써서 다크 모드가 풀립니다.

**해결 원칙: 테마를 엔진과 동일한 `'blog-theme'` 키에 저장합니다.**

- **권장(단일 키)**: `'blog-theme'`를 **유일한 테마 키로 그대로 사용**합니다. `app_basic`이 이 방식입니다 — `theme-init.js`·`theme-toggle.js`의 `THEME_STORAGE_KEY = 'blog-theme'`. 별도 동기화 코드가 필요 없어 가장 단순하고, 엔진의 `themechange` 재적용과 충돌하지 않습니다.
- **대안(이중 키)**: 템플릿 고유 키로 격리하고 싶다면, 값을 바꿀 때마다 그 키와 `'blog-theme'`를 **함께** 저장합니다(아래 8.1·8.2 예시).

> ⚠️ 흔한 버그: 고유 키(예: `'app_basic-theme'`)만 쓰면 → 토글 시 `themechange`가 발생하고 엔진이 빈 `'blog-theme'`를 읽어 **방금 한 변경을 즉시 라이트로 되돌립니다**(토글이 "안 먹는" 증상). 키를 `'blog-theme'`로 통일하면 해결됩니다.

> 코어 코드(`wakit.js`)는 절대 수정하지 않습니다. 커스텀 JS에서만 처리합니다.

---

### 8.1 app.html 인라인 스크립트 — FOUC 방지 (필수)

`<head>` 최하단에 인라인 스크립트로 삽입합니다. 외부 파일로 분리하면 로드 타이밍 문제로 FOUC가 발생할 수 있으므로 반드시 인라인으로 작성합니다.

**핵심**: 커스텀 키를 읽은 뒤, wakit이 읽는 `'blog-theme'` 키도 반드시 동기화합니다.

```html
<!-- app.html <head> 최하단에 삽입 -->
<script>
  (function() {
    try {
      var v = localStorage.getItem('my-template-theme'); // 템플릿 고유 키
      var dark = v === 'dark' || (!v && matchMedia('(prefers-color-scheme: dark)').matches);
      // wakit initApp()이 'blog-theme' 키로 applyBlogThemeSync()를 호출 — 반드시 동기화
      localStorage.setItem('blog-theme', dark ? 'dark' : 'light');
      if (dark) document.documentElement.setAttribute('data-theme', 'dark');
    } catch(e) {}
  })();
</script>
```

### 8.2 theme-toggle.js — 테마 토글 (이중 키 저장 필수)

SPA 환경에서는 뷰가 동적으로 마운트되므로 직접 `addEventListener`가 아닌 **이벤트 위임** 방식을 사용합니다. 또한 토글할 때마다 커스텀 키와 `'blog-theme'` 키를 **함께** 저장해야 합니다.

```js
// js/theme-toggle.js
(function() {
  var KEY = 'my-template-theme';       // 템플릿 고유 키
  var WAKIT_KEY = 'blog-theme';        // wakit이 initApp 시 읽는 키 — 반드시 동기화

  function isDark() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  }

  function applyDark(dark) {
    var val = dark ? 'dark' : 'light';
    localStorage.setItem(KEY, val);       // 커스텀 키 저장
    localStorage.setItem(WAKIT_KEY, val); // wakit 키 동기화
    if (dark) document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
    // 스위치 UI 동기화 (있는 경우)
    var sw = document.getElementById('themeSwitch');
    if (sw) sw.classList.toggle('is-dark', dark);
  }

  // [data-theme-toggle] 버튼 — 이벤트 위임 (SPA 필수)
  document.addEventListener('click', function(e) {
    if (!e.target.closest('[data-theme-toggle]')) return;
    applyDark(!isDark());
  });

  // #themeSwitch 토글 버튼 — 이벤트 위임
  document.addEventListener('click', function(e) {
    if (!e.target.closest('#themeSwitch')) return;
    applyDark(!isDark());
  });
})();
```

`app.html` `<body>` 끝에 로드합니다.

```html
<script src="./js/theme-toggle.js"></script>
```

#### 시스템 / 라이트 / 다크 3-옵션 (선택)

단순 토글 외에, 설정 뷰에서 **시스템·라이트·다크 3-옵션**도 같은 위임 방식으로 추가할 수 있습니다. `[data-theme-option]` 버튼을 두면 `theme-toggle.js`가 클릭을 위임 처리합니다.

```html
<div role="radiogroup" aria-label="화면 테마">
  <button data-theme-option="system">시스템</button>
  <button data-theme-option="light">라이트</button>
  <button data-theme-option="dark">다크</button>
</div>
```

```js
document.addEventListener('click', function(e) {
  var opt = e.target.closest('[data-theme-option]');
  if (!opt) return;
  setTheme(opt.getAttribute('data-theme-option')); // 'system'|'light'|'dark' → data-theme + 'blog-theme' 저장
  // 활성 옵션(.is-active) UI 동기화
});
```

> ⚠️ **SPA(app.html)에서 동작하려면 `app.html`이 `theme-toggle.js`를 로드해야 합니다.** 뷰 하단의 `<script>`는 `data-spa-ignore`로 무시되므로, 동적 주입 뷰의 컨트롤은 **셸(app.html)에서 로드한** theme-toggle.js의 위임 리스너가 처리합니다.

### 8.3 프로필/설정 뷰 스위치 UI 초기화

토글 스위치(`#themeSwitch`)가 있는 뷰에서는 뷰 로드 시점에 현재 테마 상태를 읽어 스위치 UI를 맞춥니다. 실제 토글 동작은 `theme-toggle.js`의 이벤트 위임이 처리하므로 뷰 인라인 스크립트는 UI 동기화만 담당합니다.

```html
<!-- views/profile.html 하단 -->
<script>
(function() {
  var sw = document.getElementById('themeSwitch');
  if (sw) {
    sw.classList.toggle('is-dark', document.documentElement.getAttribute('data-theme') === 'dark');
  }
})();
</script>
```

### 8.4 다크모드 CSS 오버라이드 — `!important` 필수

`wakit.css`는 `.tabbar a`에 `color: #060505`를 하드코딩합니다. 다크모드에서 아이콘·텍스트가 보이지 않으므로 템플릿 CSS에서 `!important`로 강제 덮어씁니다.

```css
/* css/style.css */
[data-theme="dark"] .tabbar {
  background: #1f2937;
  border-top-color: #374151;
}
[data-theme="dark"] .tabbar a {
  color: #ffffff !important; /* wakit.css 하드코딩 색상 오버라이드 */
}
[data-theme="dark"] .tabbar a.active {
  color: var(--color-primary); /* 활성 탭은 브랜드 색으로 */
}
```

---

## 9. 빌드 & 배포 구조

### 9.1 프로젝트 구조
각 템플릿은 독립적인 프로젝트입니다.

```
templates/{template}/
├── app.html              ← wakit 모바일 앱 (SPA)
├── views/                ← 앱 뷰 파일
├── css/                  ← 앱 스타일
├── js/                   ← 앱 스크립트
├── wakitConfig.json      ← wakit 설정
└── web/                  ← Astro 웹 레이어
    ├── src/pages/        ← 웹 페이지 (/, /board, /guestbook 등)
    ├── public/
    │   ├── wakit/        ← 빌드 시 자동 생성 (난독화된 wakit)
    │   └── app/          ← 빌드 시 자동 생성 (wakit 앱 파일)
    └── dist/             ← 최종 빌드 결과물 (배포용)
```

### 9.2 빌드 명령어
```bash
npm run build:app_test
```

빌드 순서:
1. webpack: wakit.js 난독화 → `web/public/wakit/`
2. webpack: 앱 파일 복사 → `web/public/app/`
3. astro build: 웹 페이지 빌드 + public/ 포함 → `dist/`

### 9.3 dist/ 구조 (배포 결과)
```
dist/
├── index.html            ← 랜딩 페이지
├── board/index.html      ← 게시판
├── guestbook/index.html  ← 방명록
├── app/
│   ├── app.html          ← wakit 앱 진입점
│   ├── views/
│   ├── css/
│   └── js/
└── wakit/
    └── js/wakit.js       ← 난독화 완료
```

### 9.4 배포
`dist/` 폴더를 그대로 Netlify, Vercel, 웹호스팅에 업로드

### 9.5 새 템플릿 생성 시
```bash
npm run create:template
```
→ `web/` 폴더(Astro)도 자동 생성 + `npm install` 실행

---

## 10. 개발 서버 실행

```bash
# wakit 앱 개발 (webpack dev server)
npm run dev:app_test        # http://localhost:5173/app/app.html

# Astro 웹 레이어 개발
npm run web:dev             # http://localhost:4321
# 또는 직접
cd templates/app_test/web && npm run dev
```

---

## 12. 배포 패키지 구성

### 제공 방식

| 방식 | 포함 내용 | 대상 |
|------|-----------|------|
| **프론트 템플릿** | `dist/` 빌드 파일만 | 백엔드 직접 구성하는 개발자 |
| **Supabase 연동 버전** | `dist/` + `supabase/setup.sql` | 빠르게 서비스 올리려는 사용자 |

### 패키징 명령

```bash
npm run package:app_test   # 빌드 + 스키마 포함 ZIP 자동 생성
```

결과물: `packages/hybrid-ui-template-app_test-v1.0.0.zip`

```
패키지 내부 구조
├── dist/                  ← 웹 서버에 업로드할 빌드 파일
│   ├── index.html         ← 랜딩 페이지
│   ├── app/app.html       ← wakit SPA 진입점
│   └── wakit/             ← 난독화된 wakit 엔진
├── supabase/
│   └── setup.sql          ← DB 스키마 (Supabase SQL Editor에서 실행)
├── README.md              ← 설치 가이드
└── LICENSE.txt
```

### Supabase 연동 버전 사용자 설치 절차

1. `dist/` 폴더를 웹 호스팅에 업로드
2. Supabase 대시보드에서 새 프로젝트 생성
3. SQL Editor에서 `supabase/setup.sql` 실행 (테이블·RLS·트리거 자동 생성)
4. `dist/app/app.html` 에서 URL과 anon key를 본인 값으로 교체

```html
window.sb = supabase.createClient(
  'https://YOUR_PROJECT.supabase.co',
  'YOUR_ANON_KEY'
);
```

---

### [TODO] 초기 설정 마법사 (Setup Wizard)

> 추후 구현 예정 — Supabase 연동 버전의 사용자 경험 개선

**목적:** 비개발자도 파일 수정 없이 브라우저에서 바로 Supabase 연동 가능하게 함.

**흐름:**
```
앱 첫 실행
    ↓
localStorage에 Supabase 설정값 확인
    ↓ 없으면
초기 설정 페이지 표시 (URL + anon key 입력 폼)
    ↓ 저장
localStorage에 저장 후 앱 정상 진입
(이후 접속부터는 설정 페이지 스킵)
```

**SQL 마이그레이션 처리 방안:**
- 방안 A: Service Role Key도 입력받아 앱이 API로 직접 테이블 생성 (초기 1회)
- 방안 B: Supabase SQL Editor 링크 제공 — 버튼 클릭 시 setup.sql 내용 안내 (권장)

**구현 위치:** `views/setup.html` + `wakitConfig.json`에 초기 라우트로 등록

---

## 13. 체크리스트

새 템플릿 제작 시 아래 항목을 순서대로 확인합니다.

- [ ] `templates/my-template/` 폴더 생성
- [ ] `app.html` — SPA 진입점 작성
- [ ] `index.html` — 웹 진입점 작성 (모든 태그에 `data-spa-ignore`)
- [ ] `wakitConfig.json` — 탭·라우트·테마 설정
- [ ] `manifest.json` — `start_url: "app.html"` 확인
- [ ] `css/foundation/index.css` — 디자인 토큰 import 구성
- [ ] `css/style.css` — 공통 스타일 + 다크모드 tabbar 오버라이드(`!important`) 포함
- [ ] `app.html` `<head>` 인라인 스크립트 — 커스텀 키 + `'blog-theme'` 동기화 (FOUC 방지)
- [ ] `js/theme-toggle.js` — 커스텀 키 + `'blog-theme'` 동시 저장, 이벤트 위임 방식
- [ ] `wakit-components/appbar.html` — `#appbar-brand`, `#appbar-title` id 포함
- [ ] `wakit-components/appheader.html` — `.btn-dv-back`, `.dv-title` 클래스 포함
- [ ] `wakit-components/tabbar.html` — `id="tab-{id}"` 형식, `tabs`와 1:1 매칭
- [ ] `wakit-components/splash.html` — 스플래시 화면
- [ ] `views/home.html` — 최소 1개 뷰 파일
- [ ] `npm run dev -- --env template=my-template` 로 정상 실행 확인
