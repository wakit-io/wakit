# WAKIT Engine

웹 **단벌 코드**로 웹과 앱을 함께 만들고, 앱은 웹뷰로 패키징해 사용자에게는 리액트 네이티브·플러터처럼 “앱”으로 느껴지게 하기 위한 하이브리드용 경량 엔진입니다.

## 주요 파일

- **`js/wakit.js`** — SPA 코어: 라우팅, 탭, 다이나믹 뷰, PTR, 오프캔버스, 테마 등
- **`js/wakit-bridge.js`** — SSR/정적 페이지용 브릿지: base 주입, pretty URL, `data-include`
- **`css/wakit.css`** — 앱 쉘 스타일 (앱바, 탭바, 뷰, 다이나믹 뷰, 다크 모드 등)
- **`manifest.json`**, **`service-worker.js`** — PWA 기본

상세 문서는 프로젝트 루트의 **`docs/`** 를 참고하세요.
