# WAKIT 개요

## 0. 목적 (Purpose)

**WAKIT**을 만든 목적은 한 가지입니다.

- **웹 단벌 코드**로 개발하고, 그 코드를 **하이브리드 방식**으로 웹과 앱에 동시에 씁니다.
- 웹은 그대로 브라우저에서, 앱은 **웹뷰로 패키징**(Capacitor, Cordova 등)해 스토어에 배포합니다.
- 사용자 입장에서는 **리액트 네이티브·플러터처럼** “앱 하나”처럼 느끼게 만드는 것 — 즉, **네이티브 앱에 가까운 체감**을 주는 것이 목표입니다.

그래서 WAKIT은 “웹 전용 SPA 프레임워크”가 아니라, **단벌 코드 → 웹 + 앱 패키징 → 앱처럼 느껴지게**를 위한 **하이브리드용 셸**입니다.

---

## 1. WAKIT이란

**WAKIT**은 위 목적에 맞춘 **경량 SPA 코어**입니다. 같은 HTML/JS/CSS로 웹과 패키징 앱 모두 대응합니다.

- **기술적 목표**: 메모리 적응(LRU 다이나믹 뷰, 탭 웜/콜드), 첫 페인트 개선, 짧은 전환 애니메이션, `prefers-reduced-motion` 지원 — 앱처럼 쾌적하게 느껴지도록.
- **동작 방식**: 해시 라우팅(`#path`), 탭 전환, 동적 뷰(오버레이) 스택, Pull-to-Refresh, iOS 스와이프 백 등으로 **앱 같은 흐름**을 제공합니다.

## 2. 사용 환경 구분

| 환경 | 조건 | 사용 스크립트 | 비고 |
|------|------|----------------|------|
| **SPA** | `window.Core` 존재 (wakit.js 로드 후 `Core.initApp()` 호출) | `wakit.js` | 라우팅·탭·다이나믹 뷰·PTR 등 전체 기능 |
| **SSR/정적** | `window.Core` 없음 | `wakit-bridge.js` | base 주입, pretty URL, `data-include` 파셜만 |

`wakit-bridge.js`는 SPA가 아닐 때만 동작하며, SPA일 때는 아무 작업도 하지 않습니다.

## 3. 파일 역할

| 파일 | 역할 |
|------|------|
| **wakit.js** | SPA 코어. 설정 로드, 앱 쉘 렌더링, 탭/라우터, 다이나믹 뷰, PTR, 오프캔버스, 링크 가로채기 등 |
| **wakit-bridge.js** | SSR용 경량 브릿지. `<base>` 주입, `/views/foo` → `/views/foo.html` 정규화, `data-include` 처리 |
| **wakitConfig.json** | 앱 설정(탭, 라우트, 스플래시, PTR, 테마, 탭바 옵션 등). 기본 경로 `./wakitConfig.json` |
| **wakit.css** | 기본 리셋, CSS 변수, 앱바/탭바/뷰/다이나믹 뷰/오프캔버스/PTR/스플래시/다크모드 스타일 |

## 4. SPA 초기화 흐름 (`Core.initApp`)

1. **설정 로드**: `fetch(configPath)` → `appConfig` 저장
2. **설정 반영**: 탭바 displayMode, 메모리(maxDynamicViews), PTR, 탭바 자동숨김, 애니메이션 타입(android/ios), `THEME_BASE` 계산
3. **모드 결정**: `MOBILE_MODE = theme.isMobile === true || isMobileDevice()`
4. **스플래시**: 모바일이거나 `splashForce`일 때 스플래시 표시 후 최소 표시 시간 적용
5. **테마**: `applyTheme(appConfig.theme)`, `applyBlogThemeSync()`, `themechange` 리스너
6. **앱 쉘**: `renderAppShell()` — 앱바, 뷰 컨테이너, 탭바, 오프캔버스, 백드롭 등
7. **테마 컴포넌트 주입**: `hydrateAppbarFromTheme()`, `hydrateOffcanvasFromTheme()`, (탭바 표시 시) `hydrateTabbarFromTheme()`
8. **탭**: `initTabs(appConfig.tabs)`, `initOffcanvas()`, (탭바 표시 시) `initTabbarAutoHide()`
9. **사전 로드**: `preloadTabPages()`
10. **라우터**: `initRouter()` — `hashchange` 리스너 + 첫 진입 `onHashChange()`
11. **모바일 전용**: 링크 가로채기, PTR, 오버레이 닫기, iOS 스와이프 백
12. **팝업**: `window.Popup?.init()`
13. **전역 백 네비게이션**: `window.goBackWithAnimation` 할당
14. **스플래시 제거 스케줄**: `scheduleHideSplash(splashDelayMs)` (모바일)

## 5. 라우팅 개요

- **진입점**: `location.hash` 변경 → `onHashChange()`
- **탭 페이지**: `appConfig.tabs`의 `page`와 매칭되면 해당 뷰(`#view-{slug(page)}`) 활성화
- **비탭 라우트**: `appConfig.routes`의 `path`와 매칭되면 해당 `file` HTML fetch 후 다이나믹 뷰로 표시
- **외부 URL**: `https?://` 로 시작하면 `isAllowedHtmlFetch()`로 보안 설정 확인 후 허용 시 새 창 또는 내부 로드

## 6. 보안 (HTML fetch)

- **기본**: 동일 오리진만 HTML fetch 허용
- **설정**: `appConfig.security.allowExternalRoutes === true` 또는 `security.allowedOrigins` 배열에 오리진 포함 시 해당 외부 URL 허용
- **SSR**: `<meta name="hybrid:allow-external-routes" content="1">` 로 외부 include 허용 가능 (bridge)

## 7. 전역 API (SPA)

- **`window.Core`**: 코어 객체. 공개 메서드 `initApp(configPath)`
- **`window.goBackWithAnimation()`**: 프로그래매틱 백 (다이나믹 뷰가 있으면 닫고, 없으면 `history.back()`)
- **`window.openOffcanvas(which)`** / **`window.closeOffcanvas()`**: 오프캔버스 열기/닫기 (`which`: `'left'` | `'right'`)

이어서: [02-wakitConfig.md](./02-wakitConfig.md) — 설정 스키마
