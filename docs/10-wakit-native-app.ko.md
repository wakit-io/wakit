# wakit 네이티브 앱 만들기 (강력 규칙) 🔒

[English](./10-wakit-native-app.md) · **한국어**

> **이 문서는 "동적 앱(로그인·DB 데이터)"을 wakit `/app/app.html`로 만들 때의 강력 규칙이다.**
> 이 구조를 어기면 앱 화면이 렌더되지 않는다. (실제로 SvelteKit csr로 만들었다가 앱에서 안 떠서 정립된 규칙)

---

## 0. 왜 — wakit.js 동작 원리 (반드시 이해)

`Core.initApp(config)` → wakitConfig 로드 → `MOBILE_MODE` 판정 → appbar/tabbar 렌더 → **해시 라우팅**.
화면 렌더 방식:

```
<a href="#route"> 클릭
  → 엔진이 가로채 routes[].file 을 fetch
  → extractBodyInnerHTML (<body>만 추출 + [data-spa-ignore] 제거)
  → mount.innerHTML 에 주입
  → executeInlineScripts (주입된 "일반 <script>"만 재실행)
```

즉 **wakit은 "HTML을 fetch해 통째로 끼워넣고 일반 스크립트만 돌리는" 엔진이다. 프레임워크 런타임을 부팅하지 않는다.**

### 🔒 여기서 나오는 절대 규칙
- **csr 프레임워크 페이지(SvelteKit `csr=true`, Astro client island 등)는 wakit 셸에서 렌더 안 됨.** 모듈 기반 SPA 런타임이 주입 컨텍스트에서 부팅되지 않기 때문.
- **단일 소스(웹 페이지를 앱이 fetch)는 그 페이지가 `csr=false` 순수 정적 HTML일 때만 가능.** (마케팅/콘텐츠 페이지)
- **동적 앱(로그인·per-user 데이터)의 앱 화면은 반드시 "wakit 네이티브 뷰"로 만든다** = 일반 HTML + 일반 `<script>` + `window.sb`.
- **웹(SvelteKit/Astro)과 앱(wakit)은 라우팅이 따로 돈다.** 같은 백엔드(Supabase) 공유, 프론트는 별개.

---

## 1. 구조 (app_todo 기준 — 이대로 따른다)

```
templates/{app}/
├── app.html                  ← wakit 셸: window.sb + Core.initApp + 공용 js + 디자인 css
├── wakitConfig.json          ← tabs + routes(→ ../views/*.html), 해시 라우팅
├── wakit-components/
│   ├── tabbar.html           ← 하단 탭: <a href="#route" data-id="route">
│   ├── appbar.html / appheader.html / splash.html
├── views/                    ← 앱 화면 (fragment + 일반 <script> + window.sb)
│   ├── home.html list.html favorites.html settings.html
│   ├── detail.html login.html …
├── css/todo.css              ← 디자인 시스템 (셸이 로드)
├── js/todo-app.js            ← 공용 헬퍼 window.TodoApp (셸이 로드)
└── web/                      ← (선택) SvelteKit/Astro 웹 — 앱과 별개 라우팅
```

---

## 2. 셸 `app.html` (MUST)

```html
<head>
  <link rel="stylesheet" href="/wakit/css/wakit.css"> … (엔진 css)
  <link rel="stylesheet" href="./css/foundation/index.css">  <!-- 색 토큰: 셸이 반드시 로드 -->
  <link rel="stylesheet" href="./css/todo.css">              <!-- 앱 디자인 시스템 -->
  <!-- Supabase 전역 client: 뷰의 일반 <script>에서 window.sb 로 사용 -->
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>
  <script>
    window.sb = supabase.createClient(URL, ANON_KEY, { auth:{ persistSession:true } });
  </script>
  <script src="./js/todo-app.js"></script>  <!-- 공용 헬퍼 window.TodoApp -->
  <script src="./js/theme-init.js"></script> <!-- 다크/라이트 FOUC 방지 (키 blog-theme) -->
</head>
<body id="root">
  <script type="module">
    import Core from "/wakit/js/wakit.js";
    Core.initApp('./wakitConfig.json');
  </script>
  <script src="./js/theme-toggle.js"></script> <!-- data-theme-option 위임 처리 -->
</body>
```

> 실기기에서 Supabase에 닿으려면 `URL`은 **localhost가 아니라 Mac LAN IP/배포 도메인**. (127.0.0.1은 기기 자신을 가리킴)

---

## 3. `wakitConfig.json` (MUST)

```json
{
  "appbarView": true,
  "theme": { "isMobile": false },
  "defaultTab": "home",
  "tabs": [
    { "id": "home", "label": "홈", "icon": "bi bi-house", "page": "home" },
    { "id": "list", "label": "리스트", "icon": "bi bi-list-check", "page": "list" }
  ],
  "routes": [
    { "path": "home", "file": "../views/home.html", "title": "App" },
    { "path": "detail", "file": "../views/detail.html", "title": "상세" }
  ]
}
```
- 탭은 `tabs[]`, 모든 화면은 `routes[]`(path↔file). 비-탭 화면(detail 등)도 `routes`에 등록.

---

## 4. `wakit-components/tabbar.html` (MUST)

```html
<nav class="tabbar" id="tabbar">
  <a id="tab-home" href="#home" data-id="home" class="active">
    <div class="icon"><i class="bi bi-house"></i></div><span>홈</span>
  </a>
  …
</nav>
```
- **링크는 반드시 `#route` 해시 + `data-id`.** (경로 href `/todos/` 넣으면 앱에서 안 됨)

---

## 5. 뷰 `views/*.html` (MUST — 핵심)

```html
<main class="page">
  <div id="body"><div class="spinner-row">불러오는 중…</div></div>
</main>
<script>
(async function () {
  var T = window.TodoApp, sb = T.sb;       // 셸이 제공
  var user = await T.getUser();            // 로그인 확인
  // window.sb 로 데이터 로드 + DOM 직접 구성 (vanilla)
  var r = await sb.from('todos').select('*').order('created_at',{ascending:false}).limit(10);
  document.getElementById('body').innerHTML = (r.data||[]).map(T.itemCard).join('');
})();
</script>
```

### 🔒 뷰 규칙
1. **fragment(또는 풀 HTML 문서)** — `extractBodyInnerHTML`이 `<body>` 있으면 본문만, 없으면 통째로 주입.
2. **데이터/로직은 "일반 `<script>`"** — `type="module"` **금지**(주입 시 불안정). `window.sb`·`window.TodoApp` 사용.
3. **화면 이동 = `<a href="#route">`** — 경로 링크 금지.
4. **파라미터(상세 id 등) = `sessionStorage` + 평문 `#route`.** `#detail?id=X` 처럼 **해시에 쿼리 쓰지 말 것** — 엔진의 라우트 조회가 쿼리 포함 경로로 실패함. (목록에서 클릭 시 `sessionStorage.setItem('id', …)` → `#detail` → 상세 뷰가 읽음)
5. **무한 스크롤** = `IntersectionObserver`(sentinel) + `sb…range(from, from+N-1)`.
6. **위임 이벤트** = 컨테이너에 한 번 바인딩(`item.addEventListener` 반복 금지). 항목 내부 버튼은 `preventDefault`.
7. **인증 전환(로그인/로그아웃) 후 `location.reload()`** — 탭 뷰는 1회 로드 후 캐시되므로 새로고침으로 상태 반영.
8. **테마** = `data-theme-option="system|light|dark"` 버튼만 두면 셸의 `theme-toggle.js`가 위임 처리(키 `blog-theme`).

---

## 6. 디자인 / 테마
- 디자인 시스템은 `css/todo.css`(셸 로드)에 토큰 + 컴포넌트. 다크는 `[data-theme="dark"]` 오버라이드.
- 색은 토큰만. 버튼=검정 배경/흰 글자(다크 반전), input=둥근, 호버 모션 절제.

---

## 7. 절대 하면 안 되는 것 (❌)
- ❌ 앱 화면을 **csr SvelteKit/Svelte 컴포넌트**로 만들고 wakit 셸이 띄우길 기대 → **안 뜬다.**
- ❌ 탭/이동 링크에 **경로 href(`/todos/`)** → 앱 라우팅 안 됨. `#route` 써라.
- ❌ **`#route?query`** 로 파라미터 → 라우트 조회 실패. sessionStorage 써라.
- ❌ 뷰에 **`<script type="module">`** → 주입 시 실행 불안정. 일반 script.
- ❌ Supabase URL을 **127.0.0.1**로 두고 실기기 테스트 → 안 닿음. LAN IP/배포 도메인.

---

## 8. 체크리스트
- [ ] app.html: `window.sb` + `Core.initApp` + 공용 js + 디자인 css + 토큰
- [ ] wakitConfig: tabs + 모든 화면 routes(→ ../views/*.html)
- [ ] tabbar: `#route` + `data-id`
- [ ] 뷰: fragment + 일반 `<script>` + `window.sb`/`window.TodoApp`
- [ ] 상세: sessionStorage + `#detail`
- [ ] 무한스크롤/위임/인증reload/테마(data-theme-option)
- [ ] 실기기: Supabase URL = LAN IP/배포 도메인
- [ ] 웹(SvelteKit)과 앱(wakit) 라우팅 분리 확인

---

참고: [03-bridge-and-attributes.ko.md](./03-bridge-and-attributes.ko.md) · [07-backend-integration.ko.md](./07-backend-integration.ko.md) · [09-web-layer.ko.md](./09-web-layer.ko.md)
