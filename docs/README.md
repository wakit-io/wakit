# WAKIT 문서

**WAKIT**은 **웹 단벌 코드**로 웹과 앱을 함께 만든 뒤, 앱은 웹뷰로 패키징해 사용자에게는 리액트 네이티브·플러터처럼 “앱”으로 느껴지게 하기 위한 하이브리드용 경량 SPA 엔진입니다. 이 문서는 그 사용법과 설정을 정리합니다.

## 문서 목차

| 문서 | 설명 |
|------|------|
| [01-overview.md](./01-overview.md) | WAKIT 개요, 아키텍처, 파일 역할, 실행 흐름 |
| [02-wakitConfig.md](./02-wakitConfig.md) | `wakitConfig.json` 스키마 및 옵션 |
| [03-bridge-and-attributes.md](./03-bridge-and-attributes.md) | `wakit-bridge.js`, data 속성, 메타 태그 |
| [04-wakit-css.md](./04-wakit-css.md) | `wakit.css` 변수, 레이아웃, 클래스 |
| [05-template-guide.md](./05-template-guide.md) | 새 템플릿 제작 가이드 (폴더 구조, 파일별 역할, 체크리스트) |

## 빠른 참조

- **SPA 진입점**: `Core.initApp('./wakitConfig.json')` (기본 설정 경로)
- **SSR/정적 페이지**: `wakit-bridge.js`만 로드 시 base 주입·pretty URL·`data-include` 처리
- **설정 파일**: 테마 루트의 `wakitConfig.json` (탭, 라우트, 스플래시, PTR 등)
