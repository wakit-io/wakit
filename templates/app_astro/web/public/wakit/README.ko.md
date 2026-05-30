# WAKIT Engine

[English](./README.md) · **한국어**

WAKIT의 핵심을 이루는 경량 하이브리드 런타임입니다. 한 벌의 HTML / CSS / JS로
만들고, 웹사이트로 실행하며, 같은 코드를 WebView 래퍼(Capacitor / Cordova)로
네이티브 앱으로 패키징합니다 — 웹 플랫폼을 벗어나지 않고도 React Native나
Flutter처럼 느껴지게.

이 폴더는 엔진만 담고 있습니다. 빌드 시 템플릿 결과물에 복사되어 앱과 함께
서빙됩니다. 템플릿·빌드 파이프라인·패키징을 포함한 전체 프로젝트는
[프로젝트 루트 README](../README.md)를 참고하세요.

## 구성

### `js/`

| 파일              | 역할                                                                                                       |
| ----------------- | ---------------------------------------------------------------------------------------------------------- |
| `wakit.js`        | SPA 코어 — 설정 로드, 앱 셸 렌더링, 탭/라우터, 다이나믹 뷰 오버레이 스택, Pull-to-Refresh, 오프캔버스, 테마, 링크 가로채기. `window.Core`가 있을 때 동작. |
| `wakit-bridge.js` | SSR/정적 브릿지 — SPA 모드에서는 동작하지 않음. 일반 페이지에서 `<base>`를 주입하고 pretty URL(`views/foo` → `views/foo.html`)을 정규화하며 `data-include` 파셜을 처리. |
| `wakit-popup.js`  | 독립 팝업 라이브러리 — `<a class="popup" href="...">`의 HTML을 모달 또는 시트로 열고, 로드된 HTML 안의 인라인/외부 스크립트를 실행. `Core` 없이 동작하며 의존성 없음. API: `Popup.init()`, `Popup.open(url, opts)`, `Popup.close()`. |

### `css/`

| 파일              | 역할                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------ |
| `wakit.css`       | 앱 셸 스타일 — 리셋, CSS 변수, 앱바, 탭바, 뷰, 다이나믹 뷰, 오프캔버스, Pull-to-Refresh, 스플래시, 다크모드. |
| `wakit-popup.css` | `wakit-popup.js`용 팝업 스타일 (충돌 방지를 위해 `hy-` 클래스 접두사 사용).                |
| `styleguide.css`  | 디자인 토큰 — 타이포그래피 스케일과 색상 변수 (Pretendard 기반).                           |
| `component.css`   | 재사용 UI 컴포넌트 스타일 (게시물 리스트, 섹션 헤더, 프레임 등).                           |

### `assets/`

| 폴더            | 내용                                       |
| --------------- | ------------------------------------------ |
| `icons/`        | PWA 앱 아이콘 (192×192, 512×512).          |
| `buttons/`      | 인라인 버튼 아이콘 SVG.                     |
| `social-login/` | 소셜 로그인 마크 SVG (예: GitHub).         |

### PWA

| 파일                | 역할                                                          |
| ------------------- | ------------------------------------------------------------- |
| `manifest.json`     | PWA manifest (이름, 아이콘, 표시 모드, 테마 색상).            |
| `service-worker.js` | 서비스 워커 — 오프라인/설치형 사용을 위한 cache-first fetch. |

## 런타임 모드

엔진은 모드를 자동으로 선택합니다:

- **SPA** — `window.Core`가 있을 때 (`Core.initApp(configPath)` 호출 후),
  `wakit.js`가 라우팅·탭·다이나믹 뷰·PTR·오프캔버스·테마를 구동합니다.
- **SSR/정적** — `window.Core`가 없을 때는 `wakit-bridge.js`만 동작하며,
  `<base>` 주입·pretty URL·`data-include`를 처리합니다.

## 전역 API (SPA)

- `window.Core.initApp(configPath)` — 앱 셸 초기화.
- `window.goBackWithAnimation()` — 프로그래매틱 백 (다이나믹 뷰가 열려 있으면
  닫고, 없으면 `history.back()`).
- `window.openOffcanvas('left' | 'right')` / `window.closeOffcanvas()`.
- `window.Popup.init()` / `Popup.open(url, opts)` / `Popup.close()`.

## 문서

상세 가이드는 프로젝트 루트의 [`docs/`](../docs)에 있습니다 (`01-overview` →
`06-design-guide`).
