# WAKIT 문서

[English](./README.md) · **한국어**

**WAKIT**은 **웹 단벌 코드**로 웹과 앱을 함께 만든 뒤, 앱은 웹뷰로 패키징해 사용자에게는 리액트 네이티브·플러터처럼 “앱”으로 느껴지게 하기 위한 하이브리드용 경량 SPA 엔진입니다. 이 문서는 그 사용법과 설정을 정리합니다.

## 문서 목차

| 문서 | 설명 |
|------|------|
| [01-overview.ko.md](./01-overview.ko.md) | WAKIT 개요, 아키텍처, 파일 역할, 실행 흐름 |
| [02-wakitConfig.ko.md](./02-wakitConfig.ko.md) | `wakitConfig.json` 스키마 및 옵션 |
| [03-bridge-and-attributes.ko.md](./03-bridge-and-attributes.ko.md) | `wakit-bridge.js`, data 속성, 메타 태그 |
| [04-wakit-css.ko.md](./04-wakit-css.ko.md) | `wakit.css` 변수, 레이아웃, 클래스 |
| [05-template-guide.ko.md](./05-template-guide.ko.md) | 새 템플릿 제작 가이드 (폴더 구조, 파일별 역할, 체크리스트) |
| [06-design-guide.ko.md](./06-design-guide.ko.md) | 디자인 가이드라인 |
| [07-backend-integration.ko.md](./07-backend-integration.ko.md) | 백엔드 연동 & 에이전트 가이드 (연동 seam, 규칙, 배포 컨텍스트) |
| [08-web-and-mobile.ko.md](./08-web-and-mobile.ko.md) | 한 코드 → PC는 웹사이트 / 모바일은 네이티브풍 앱 (규칙) |

## 빠른 참조

- **SPA 진입점**: `Core.initApp('./wakitConfig.json')` (기본 설정 경로)
- **SSR/정적 페이지**: `wakit-bridge.js`만 로드 시 base 주입·pretty URL·`data-include` 처리
- **설정 파일**: 테마 루트의 `wakitConfig.json` (탭, 라우트, `webNav`, 스플래시, PTR 등)
