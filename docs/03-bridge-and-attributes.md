# wakit-bridge.js / data 속성 / 메타 태그

## 1. wakit-bridge.js 역할

SPA가 **아닐 때**(`window.Core`가 없을 때)만 동작하는 경량 스크립트입니다. 두 가지 기능을 제공합니다.

### 1.1 Base 주입 (SSR에서 상대 경로 정상 동작)

- **목적**: `views/xxx.html` 같은 상대 경로가 중첩 페이지(예: `views/board/view.html`)에서도 올바르게 동작하도록 함.
- **동작**: 현재 URL이 `.../templates/blog/views/home` 또는 `.../views/home.html` 형태일 때, 그 위 디렉터리(테마 루트)를 `<base href="...">`로 `head`에 추가.
- **비활성화**: `<meta name="hybrid:disable-base" content="...">`가 있으면 base 주입 안 함.

### 1.2 Pretty URL 정규화 (새로고침 시 404 방지)

- **목적**: 정적 서버에서 `/views/foo`로 접근해도 실제 파일은 `views/foo.html`인 경우, URL을 `.../views/foo.html`로 바꿔 새로고침 시 404를 막음.
- **동작**:  
  - `/views/foo/` → `/views/foo.html`  
  - `/views/foo` → `/views/foo.html`  
  `history.replaceState`로 주소만 교체.
- **비활성화**: `<meta name="hybrid:disable-pretty-urls" content="...">`가 있으면 정규화 안 함.

### 1.3 data-include (파셜/include, SSR 전용)

- **목적**: 정적/SSR 페이지에서 HTML 조각을 원격에서 가져와 삽입.
- **동작**:  
  - `[data-include="url"]` 요소를 찾아 `url`을 fetch한 뒤, 응답 HTML로 해당 요소의 `innerHTML`을 교체.  
  - `<link rel="stylesheet">`는 `head`로 이동, `<script>`는 새 요소로 복사 후 실행하고 기존 스크립트는 제거.  
  - `data-props`에 JSON 문자열을 주면 `${key}` 치환 지원.
- **표시 조건**: `data-include-when="mobile"|"web"|"both"` (기본 `both`). User-Agent로 mobile/web 구분.
- **URL 해석**:  
  - `wakit-components/`, `assets/`, `_css/`, `views/`로 시작하면 **테마 루트** 기준.  
  - 그 외(예: `./partials/x.html`)는 **현재 문서 디렉터리** 기준.
- **크로스 오리진**: 기본적으로 동일 오리진만 허용. 다른 오리진 허용 시 `<meta name="hybrid:allow-external-routes" content="1">` 필요.
- **처리 완료 표시**: 처리된 노드에는 `data-include-processed="1"`이 붙음.

---

## 2. 메타 태그 (hybrid / wakit)

| 메타 name | 설명 | 사용처 |
|-----------|------|--------|
| `hybrid:disable-base` | 있으면 base 주입 안 함 | SSR |
| `hybrid:disable-pretty-urls` | 있으면 pretty URL 정규화 안 함 | SSR |
| `hybrid:allow-external-routes` | 있으면 SSR에서 외부 `data-include` 허용 | SSR |
| `hybrid:disable-onboarding` | 있으면 온보딩 오버레이 비활성화 | SPA |
| `hybrid:disable-intro` | 있으면 인트로 오버레이 비활성화 | SPA |
| `wakit:no-dv-title` | content="1" 또는 true 시, 다이나믹 뷰 헤더에 페이지 타이틀 표시 안 함 | 로드되는 HTML의 head |

---

## 3. data 속성 (SPA / 공통)

### 3.1 include / 파셜 (SPA에서는 wakit.js, SSR에서는 bridge)

| 속성 | 값 | 설명 |
|------|-----|------|
| `data-include` | URL | 가져올 HTML 조각 URL |
| `data-include-when` | `mobile` \| `web` \| `both` | 표시할 환경. 기본 `both` |
| `data-props` | JSON 문자열 | `${key}` 치환용 객체 |
| `data-include-cache` | `once` | SPA에서 한 번 로드한 HTML 캐시 (동일 키 재사용) |
| `data-include-processed` | (자동 설정) | 처리 완료 시 `1` |

### 3.2 스타일/스크립트 제어 (SPA)

| 속성 | 위치 | 설명 |
|------|------|------|
| `data-spa-ignore` | 모든 요소 (`link`, `style`, `script`, `div` 등) | **일반 요소**: SPA 주입 시 DOM에 렌더링하지 않음. **link/style**: head로 올리지 않고 제거. **script**: 실행하지 않음. |
| `data-once` | `link`, `style`, `script` | 전역으로 한 번만 적용/실행. 키로 중복 제거 |

### 3.3 탭 / 라우팅

| 속성 | 요소 | 설명 |
|------|------|------|
| `href="#page"` | `a` | 해시 라우트. 탭 전환 또는 라우트 진입 |
| `data-tab` | `a` | 클릭 시 전환할 탭 페이지 (href 대신 사용 가능) |
| `data-link` | `a` | 모바일에서 이동할 경로. 없으면 `href` 사용 |
| `data-link-block` | `a` | 있으면 클릭 기본 동작 차단 |
| `data-new-window` | `a` | 새 창에서 열기 (target="_blank"와 유사) |

### 3.4 오프캔버스

| 속성 | 설명 |
|------|------|
| `data-open-offcanvas` | `left` \| `right` — 클릭 시 해당 방향 오프캔버스 열기 |
| `data-close-offcanvas` | 클릭 시 오프캔버스 닫기 |
| `.open-offcanvas-left`, `.open-offcanvas-right` | 클래스로도 열기 트리거 |
| `.offcanvas-close` | 클래스로 닫기 트리거 |

### 3.5 오버레이 닫기

| 속성/클래스 | 설명 |
|-------------|------|
| `data-close-onboarding`, `.onboarding-close` | 온보딩 오버레이 닫기 |
| `data-close-intro`, `.intro-close` | 인트로 오버레이 닫기 |

### 3.6 다이나믹 뷰 (내부용)

| 속성 | 설명 |
|------|------|
| `data-path` | 다이나믹 뷰의 라우트 경로 |
| `data-used` | `1` = 사용 중, `0` = 빈 슬롯 |
| `data-closing` | `1` = 닫는 중 |

### 3.7 댓글

| 속성 | 설명 |
|------|------|
| `data-comments-init` | JSON 문자열. 댓글 모듈 초기화 옵션 (apiBase, context, contextId 등) |

### 3.8 테마

| 속성 | 설명 |
|------|------|
| `data-theme` | `dark` \| `light` 등. 루트/컨테이너에 지정 시 다크 모드 등 적용 (wakit.css와 연동) |

---

## 4. 전역 함수 (SPA)

- **`goBackWithAnimation()`**: 백 동작. 다이나믹 뷰가 있으면 하나 닫고, 없으면 `history.back()`.
- **`openOffcanvas(which)`**: `which`는 `'left'` 또는 `'right'`.
- **`closeOffcanvas()`**: 열린 오프캔버스 닫기.

이어서: [04-wakit-css.md](./04-wakit-css.md) — CSS 변수·레이아웃
