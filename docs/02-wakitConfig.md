# wakitConfig.json 스키마

앱 동작을 제어하는 설정 파일입니다. 기본 경로는 `./wakitConfig.json`이며, `Core.initApp(configPath)`로 다른 경로를 지정할 수 있습니다.

## 1. 최상위 키 요약

| 키 | 타입 | 설명 |
|----|------|------|
| `splashDelay` | number | 스플래시 제거 전 대기 시간(ms). 기본 200 |
| `splashForce` | boolean | true면 데스크톱에서도 스플래시 표시 |
| `defaultTab` | string | 기본(메인) 탭 페이지. `tabs[].page` 또는 `tabs[].id`와 매칭 |
| `tabs` | array | 하단 탭바 항목 목록 (모바일/SPA) |
| `routes` | array | path → file 매핑 (비탭 라우트, 모바일/SPA) |
| `webNav` | object | 웹 헤더 메뉴 (웹 모드 전용, 파일에 직접 링크) |
| `tabbar` | object | 탭바 표시/자동숨김 옵션 |
| `pullToRefresh` | object | PTR 제스처 옵션 |
| `theme` | object | 테마(색, 폰트, isMobile) |
| `memory` | object | 다이나믹 뷰 개수 등 메모리 관련 |
| `animations` | object | android/ios 애니메이션 타입 |
| `security` | object | 외부 HTML fetch 허용 설정 |

---

## 2. tabs

각 항목은 `id`, `label`, `icon`, `page`를 가집니다.

```json
{
  "tabs": [
    { "id": "home", "label": "홈", "icon": "🏠", "page": "home" },
    { "id": "profile", "label": "마이", "icon": "👤", "page": "profile" }
  ]
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | string | 탭 식별자. `#tab-{id}` 등에 사용 |
| `label` | string | 탭에 표시되는 텍스트 |
| `icon` | string | 이모지 또는 아이콘 표시용 문자열 |
| `page` | string | 라우트/뷰와 매칭되는 페이지 키. `views` 내 `#view-{slug(page)}`와 연결 |

---

## 3. routes

path → HTML 파일(또는 외부 URL) 매핑. 탭에 없는 경로는 이 목록으로 다이나믹 뷰를 로드합니다.

```json
{
  "routes": [
    { "path": "home", "file": "../views/service-3.html", "title": "WAKIT Template" },
    { "path": "board/view", "file": "board/view.html", "title": "게시판 상세" },
    { "path": "naver", "file": "http://127.0.0.1:51146/...", "title": "네이버" }
  ]
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `path` | string | 해시 라우트 경로 (예: `board/view`). `#path`로 접근 |
| `file` | string | 로드할 HTML URL. 상대 경로는 테마 루트(`THEME_BASE`) 기준 |
| `title` | string | (선택) 브라우저/앱바 타이틀 등에 사용 가능 |

- **상대 경로**: `../views/xxx.html`, `board/view.html` 등 — 테마 루트 기준으로 해석
- **절대 URL**: `https?://` — `security.allowExternalRoutes` 또는 `security.allowedOrigins`가 허용할 때만 fetch

---

## 3.5 webNav (웹 헤더 메뉴)

웹 모드(Bridge)에서 상단 헤더에 표시할 메뉴를 정의합니다. **모바일 네비와 완전히 분리된 설정**입니다.

> **모바일(`tabs`/`routes`) vs 웹(`webNav`)**
> - 모바일/SPA: `<a href="#route">` 해시 라우팅 — 엔진(`wakit.js`)이 `tabs`·`routes`를 읽어 가로챔
> - 웹/Bridge: `<a href="views/foo.html">` **파일에 직접 링크** — `webNav`만 사용, `routes`는 타지 않음
>
> 두 메뉴는 구성이 달라도 됩니다 (예: 웹 6개, 모바일 탭 4개). 공유하는 것은 물리적 뷰 파일뿐입니다.

```json
{
  "webNav": {
    "brand": { "label": "App Basic", "logo": "✦", "href": "index.html" },
    "items": [
      { "label": "홈", "href": "index.html" },
      { "label": "상세", "href": "views/detail.html" },
      { "label": "영화 홈", "href": "views/movie-home.html" }
    ],
    "cta": { "label": "시작하기", "href": "views/movie-more.html" }
  }
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `brand` | object | (선택) 로고 영역. `{ label, logo, href }`. 미설정 시 헤더 마크업 기본값 사용 |
| `items` | array | 메뉴 항목. 각 항목 `{ label, href }` — `href`는 **파일 경로**(테마 루트 기준 상대 경로) |
| `cta` | object | (선택) 우측 강조 버튼. `{ label, href }`. 미설정 시 버튼 숨김 |

- `href`는 라우트 id가 아니라 **실제 파일 경로**입니다 (예: `views/contact.html`). 테마 루트 기준으로 해석됩니다.
- 헤더(`wakit-components/header.html`)가 `wakitConfig.json`을 `fetch`해 `webNav`를 읽어 메뉴를 렌더링합니다. 데이터 출처는 헤더 스크립트의 `getNavData()` 한 곳에 모여 있어, 추후 서버 구동(API/SSR)으로 교체하려면 이 함수만 바꾸면 됩니다.
- 현재 페이지와 일치하는 항목은 `is-active` 클래스로 강조됩니다(파일 경로 비교, `index.html`↔`/` 동일 취급).

---

## 4. defaultTab

첫 진입 또는 기본 탭으로 보여줄 페이지. `tabs[].page` 또는 `tabs[].id`와 일치하는 값.

- 지원 별칭: `defaultTab`, `defaultTabPage`, `mainTab`, `mainTabPage` (우선순위 순)
- 없으면 `tabs[0].page` 사용

---

## 5. tabbar

```json
{
  "tabbar": {
    "autoHide": false,
    "hideThreshold": 14,
    "displayMode": "always"
  }
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `autoHide` | boolean | true면 스크롤 시 탭바 숨김/표시 (모바일, 탭바 표시 시만) |
| `hideThreshold` | number | 자동숨김 트리거 스크롤 델타(px). 기본 14 |
| `displayMode` | string | `"always"` \| `"pwa"`. `pwa`면 PWA 모드에서만 탭바 표시 |

- 최상위 `tabbarAutoHide`, `tabbarAutoHideThreshold`도 동일 동작에 사용됩니다.

---

## 6. pullToRefresh

```json
{
  "pullToRefresh": {
    "threshold": 90,
    "startSlop": 18,
    "damping": 0.35,
    "maxPull": 200
  }
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `threshold` | number | PTR 활성화 임계값(px). 기본 64 |
| `damping` | number | 화면 이동/인디케이터 비율 (0~1). 기본 0.5 |
| `maxPull` | number | 제스처 인식 최대 거리(px). 최소 40 |
| `startSlop` | number | 미세 움직임 무시 거리(px). `activationSlop` 별칭 |
| `directionLockRatio` | number | 세로 우선 비율 (dy >= dx * ratio). `lockRatio` 별칭 |
| `ignoreEdgeX` | number | iOS 왼쪽 엣지 스와이프 무시 영역(px). `edgeIgnoreX` 별칭 |

---

## 7. theme

```json
{
  "theme": {
    "primaryColor": "#232323",
    "font": "Pretendard, system-ui",
    "isMobile": false
  }
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `primaryColor` | string | CSS 색상. 강조/활성 탭 등에 사용 |
| `font` | string | font-family 값 |
| `isMobile` | boolean | true면 데스크톱에서도 모바일 UI(탭바, PTR 등) 사용 |

---

## 8. splashDelay / splashForce

- **splashDelay**: 스플래시를 숨기기 전 대기 시간(ms). 최소 표시 시간(코어 내 1200ms)과 함께 적용
- **splashForce**: true면 모바일이 아니어도 스플래시 표시

---

## 9. memory

```json
{
  "memory": {
    "maxDynamicViews": 6
  }
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `maxDynamicViews` | number | 동시 유지할 다이나믹 뷰 최대 개수. 2 이상. 미설정 시 기기 메모리에 따라 4~10 |

---

## 10. animations

```json
{
  "animations": {
    "android": "scale",
    "ios": "slide"
  }
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `android` | string | Android 다이나믹 뷰 전환. `scale` \| `slide` 등 |
| `ios` | string | iOS 다이나믹 뷰 전환. `slide` \| `scale` \| `fade` 등 |

CSS 클래스: `.android-animation-scale`, `.android-animation-slide`, `.ios-animation-slide`, `.ios-animation-scale`, `.ios-animation-fade` 등과 연동됩니다.

---

## 11. security

```json
{
  "security": {
    "allowExternalRoutes": false,
    "allowedOrigins": ["https://trusted.example.com"]
  }
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `allowExternalRoutes` | boolean | true면 모든 오리진으로 HTML fetch 허용 |
| `allowedOrigins` | string[] | 허용할 오리진 목록. `routes[].file`이 외부 URL일 때 적용 |

- 동일 오리진은 항상 허용됩니다.
- `allowExternalRoutes`가 true면 `allowedOrigins` 없이도 외부 URL 로드 가능합니다.

---

이어서: [03-bridge-and-attributes.md](./03-bridge-and-attributes.md) — Bridge와 data 속성
