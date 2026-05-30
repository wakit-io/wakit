# 백엔드 연동 & 에이전트 가이드

이 문서는 **이 템플릿을 받아 백엔드를 연동하려는 개발자(또는 에이전트)** 를 위한 것입니다.
WAKIT 템플릿은 "완제품"이 아니라 **백엔드 비종속(backend-agnostic) 프론트 스캐폴드**입니다.
어디에 무엇을 꽂으면 되는지를 이 한 장으로 파악할 수 있게 정리했습니다.

> 에이전트에게: 이 파일과 [01-overview.md](./01-overview.md), [02-wakitConfig.md](./02-wakitConfig.md)를
> 먼저 읽으면 구조 파악이 끝납니다. 규칙은 아래 5절을 반드시 준수하세요.

---

## 1. 이 템플릿의 정체

```
생성된 템플릿 (프론트만)
   ├─ 모드 A: 그대로 사용 → 정적 웹 / 설치형 PWA (백엔드 없이도 동작)
   └─ 모드 B: 개발자·에이전트가 받아서 → 자기 서버/API 연동 → 제품 완성
```

- 특정 백엔드를 가정하지 않습니다. Supabase는 **선택지일 뿐** 강제가 아닙니다.
- 엔진(`wakit/js/wakit.js`)은 백엔드를 전혀 모릅니다. 데이터·인증은 전적으로 뷰/연동 레이어의 몫입니다.

---

## 2. 두 실행 모드 (먼저 어느 모드인지 파악)

| 모드 | 진입점 | 조건 | 네비게이션 |
|------|--------|------|------------|
| **SPA** | `app.html` | `window.Core` 존재 | `<a href="#route">` 해시 라우팅 (엔진이 가로챔) |
| **Bridge/SSR** | `index.html` | `window.Core` 없음 | `<a href="views/foo.html">` **파일 직접 링크** |

- 백엔드(서버 렌더링/CMS)에 붙이는 시나리오는 보통 **Bridge 모드**입니다.
- Bridge는 `<base>` 주입, `/views/foo` → `/views/foo.html` 정규화, `data-include` 파셜만 처리하고 **라우팅은 하지 않습니다**. 자세한 건 [03-bridge-and-attributes.md](./03-bridge-and-attributes.md).

---

## 3. 단일 계약 — `wakitConfig.json`

앱의 구조(페이지·메뉴·테마)는 전부 [02-wakitConfig.md](./02-wakitConfig.md)의 `wakitConfig.json` 한 곳에 선언됩니다. 연동 전 이 파일부터 읽으세요.

| 키 | 용도 | 비고 |
|----|------|------|
| `routes[]` | 페이지 풀 (path → file) | 모바일/SPA가 사용 |
| `tabs[]` | 모바일 하단 탭바 | 엔진이 읽음 (`.page`/`.id`) |
| `webNav` | 웹 헤더 메뉴 | **파일 href 직접 링크**, `routes`와 무관 |
| `theme` | 색·폰트·isMobile | |

> `tabs`(모바일)와 `webNav`(웹)는 **구성이 달라도 됩니다** (예: 웹 6개 / 모바일 4개). 공유하는 것은 물리적 뷰 파일뿐입니다.

---

## 4. 백엔드를 꽂는 자리 (seam)

연동 시 건드릴 지점은 다음과 같이 **소수의 깨끗한 seam**으로 모여 있습니다.

### 4.1 데이터 (가장 중요)
- 각 뷰(`views/*.html`)는 일반 `<script>`에서 데이터를 가져와 DOM을 채웁니다.
- **Supabase 경로**: `app.html`/`index.html`에서 `window.sb`를 전역으로 초기화 → 뷰에서 `window.sb.from(...)`, `window.sb.auth...` 사용.
- **자체 백엔드 경로**: 뷰의 `<script>`에서 `fetch('/api/...')`로 교체하면 됩니다. 엔진은 관여하지 않습니다.

### 4.2 네비게이션 메뉴 출처
- 웹 헤더 메뉴는 `wakit-components/header.html`의 **`getNavData()` 한 함수**가 출처입니다.
- 기본은 `wakitConfig.json`의 `webNav`를 `fetch`해 읽습니다. **서버 구동(API/SSR)으로 바꾸려면 이 함수만 교체**하면 됩니다.

### 4.3 뷰 로딩 / 공통 파셜
- `data-include="wakit-components/header.html"` 형태로 헤더·푸터 등 공통 파셜을 주입합니다 (Bridge가 처리).
- 동적/오버레이 뷰는 SPA 모드에서 `routes[].file`을 fetch해 로드합니다.

### 4.4 인증
- Supabase Auth 사용 시 `window.sb.auth.signUp()/signInWithPassword()`.
- RLS에는 `raw_user_meta_data` 대신 **`app_metadata`** 를 사용하세요.

---

## 5. 연동 시 반드시 지킬 규칙

엔진과 충돌하지 않으려면 다음을 지켜야 합니다 (위반 시 조용히 깨집니다).

- **SPA 화면 이동**은 반드시 `<a href="#routeName">`. `<button>` + JS navigate는 동작하지 않습니다.
- 새 라우트는 `wakitConfig.json`의 `tabs` 또는 `routes`에 등록해야 합니다.
- **웹 헤더 메뉴**는 `webNav`로 관리하며 해시가 아니라 **파일 경로**로 링크합니다.
- 뷰 내부 스크립트는 `<script type="module">` 금지 → 일반 `<script>` 사용 (모듈 스크립트는 뷰에서 불안정).
- Supabase는 `app.html`/`index.html`에서 UMD CDN으로 로드해 `window.sb`로 전역 사용.

---

## 6. 배포 산출물에 에이전트 컨텍스트 싣기

받은 사람이 **에이전트로 백엔드 연동**을 하려면, 배포 zip이 다음을 포함해야 합니다.
(현재 `scripts/package-template.js`는 `dist/` + `setup.sql` + 기본 README만 담으므로, 아래를 추가 대상으로 관리합니다.)

| 항목 | 성격 | 만드는 방법 |
|------|------|-------------|
| 공통 구조 설명 | 모든 템플릿 동일 | 이 `docs/`(또는 요약 `WAKIT.md`)를 **고정 복사** |
| 앱별 설명 (`AGENT.md`) | 템플릿마다 다름 | **위저드 입력값 + 프롬프트로 자동 생성** — 탭/페이지 목록, `webNav`, 각 뷰가 필요로 하는 데이터, 백엔드 연동 지점 |
| `wakitConfig.json` | 계약 | 읽기 가능한 형태로 포함 |
| 연동 소스 | 연동 대상 | 연동에 필요한 파일은 난독화에서 제외 |

> 목표: 받은 사람이 "이 템플릿에 내 백엔드 붙여줘"라고 했을 때, 에이전트가 `AGENT.md` 한 장으로 구조를 파악해 작업할 수 있게 하는 것.

---

## 7. 디렉터리 구조 (연동 관점)

```
templates/{name}/
├── app.html / index.html   ← 진입점 (window.sb 초기화 지점)
├── wakitConfig.json        ← 구조 계약 (routes / tabs / webNav / theme)
├── views/*.html            ← 페이지 본문 + 데이터 fetch 스크립트  ← 연동 핵심
├── wakit-components/
│   └── header.html         ← getNavData() (메뉴 출처 seam)
├── js/                     ← theme-toggle 등 보조 스크립트
└── css/                    ← 테마 토큰 + 뷰별 스타일
```

---

이어서: [01-overview.md](./01-overview.md) · [02-wakitConfig.md](./02-wakitConfig.md)
