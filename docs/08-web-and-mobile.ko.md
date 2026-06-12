# PC는 웹, 모바일은 앱 (한 코드)

[English](./08-web-and-mobile.md) · **한국어**

WAKIT는 **같은 뷰**를 데스크톱에선 제대로 된 웹사이트로, 모바일에선 네이티브풍 앱으로
렌더링합니다. 한 코드로 양쪽이 제대로 보이게 하는 규칙을 정리합니다.

---

## 1. 한 소스, 두 얼굴

| | PC / 웹 | 모바일 / 앱 |
|---|---|---|
| 진입점 | `index.html` (Bridge) | `app.html` (SPA + `wakit.js`) |
| 외형 | 상단 네비 헤더 · 푸터 · 넓은 레이아웃 | 앱바 · 하단 탭바 · 다이나믹 뷰 전환 |
| 네비게이션 | `webNav` 헤더 메뉴 → 파일 링크 | `tabs`/`routes` → 해시 라우팅 |
| 대상 | 데스크톱 브라우저, SEO, 공유 | 설치형 PWA, 모바일 기기 |

`views/*.html`은 **공유**되고, 셸과 모드만 달라집니다.

---

## 2. 엔진이 모드를 정하는 방식

- `MOBILE_MODE = theme.isMobile === true || isMobileDevice()` ([01-overview.ko.md](./01-overview.ko.md) 참고)
- `wakit.js`가 `<html>`에 모드 클래스를 부여: **`.desktop-mode`** 또는 **`.mobile-mode`**, 그리고 `.pwa-mode`, `.ios` / `.android` ([04-wakit-css.ko.md](./04-wakit-css.ko.md) 참고)
- 설정 (`wakitConfig.json`):
  - **`theme.isMobile: false`** → 데스크톱 = `desktop-mode`(웹), 모바일 기기 = `mobile-mode`(앱). **"PC=웹 / 모바일=앱"을 원하면 이 값.**
  - `theme.isMobile: true` → 데스크톱에서도 앱 UI (키오스크 / 앱 전용)
- `desktop-mode`에선 엔진이 **앱바·탭바를 자동으로 숨기고**, `mobile-mode`에선 보여줍니다.

---

## 3. 규칙

### 규칙 1 — 뷰를 반응형으로 작성
뷰는 넓은 화면에선 **데스크톱 웹 템플릿**처럼, 좁은 화면에선 **모바일 앱**처럼 보여야 합니다 — 모바일 레이아웃을 늘린 게 아니라 각각 제대로.

- 콘텐츠를 `.container`로 감싸기 (데스크톱에서 max-width 가운데 정렬)
- 모바일 우선 CSS + 미디어쿼리로 확장:

```css
.feature-grid { display: grid; grid-template-columns: 1fr; gap: 16px; } /* 모바일: 1열 */
@media (min-width: 768px) {
  .feature-grid { grid-template-columns: repeat(3, 1fr); }              /* 데스크톱: 3열 */
}
```

### 규칙 2 — 웹 ≠ 앱일 때 모드 클래스로 분기
엔진이 `<html>`에 붙인 클래스로 같은 뷰를 다르게 렌더:

```css
.desktop-mode .home-hero { padding: 80px 0; }  /* 여유로운 웹 히어로 */
.mobile-mode  .home-hero { padding: 24px 0; }  /* 컴팩트한 앱 */
```

탭바·앱바 표시/숨김은 엔진이 모드별로 이미 처리하니, **자기 콘텐츠**의 분기만 추가하면 됩니다.

### 규칙 3 — 네비 이중화 (이미 구축됨)
- **웹**: `webNav` 헤더 메뉴 → `views/foo.html`(파일) 링크
- **모바일**: `tabs` + `routes` → `<a href="#route">`(해시) → 네이티브 전환
- **List → Detail**이 시그니처 동선: 모바일에선 다이나믹 뷰 오버레이 전환, 웹에선 페이지 이동. 둘 다 같은 뷰 파일 사용.

### 규칙 4 — PC웹 + 모바일앱 설정
```json
{
  "theme": { "isMobile": false, "primaryColor": "#3b82f6" },
  "appbarView": true,
  "tabbar": { "displayMode": "always" }
}
```
`isMobile: false`가 핵심 스위치.

### 규칙 5 — 뷰 패턴 + 토큰 준수
- 풀 문서 뷰, header/footer include에 `data-spa-ignore`, 화면 CSS는 `<body>` 안, `<main>`에 `container` ([05-template-guide.ko.md](./05-template-guide.ko.md) 6.2·6.3 참고)
- **foundation 토큰**(`--color-*` 등)만 사용 → 라이트/다크·일관성 자동

---

## 4. 체크리스트

- [ ] `theme.isMobile: false` (데스크톱도 앱 UI로 갈 게 아니면)
- [ ] 모든 뷰: `container` + 반응형 (그리드/컬럼이 모바일에서 1열로)
- [ ] 데스크톱 = 상단 네비 + 푸터 + 넓은 레이아웃 / 모바일 = 탭바 + 전환
- [ ] `webNav`(웹)와 `tabs`/`routes`(모바일)가 **같은** 뷰 파일을 가리킴
- [ ] 양쪽 테스트: 데스크톱 브라우저(웹) + 좁은 화면/PWA(앱)

---

## 5. 흔한 실수

- `isMobile: true` 방치 → PC가 웹사이트가 아니라 늘어난 앱처럼 보임
- 모바일 전용 레이아웃을 데스크톱에서 풀폭으로 늘림(미디어쿼리 없음) → PC에서 깨져 보임
- 토큰 대신 색 하드코딩 → 다크모드 깨짐
- **웹** 헤더에서 해시 `#route` 링크 사용 (웹은 `webNav`로 파일 링크 써야 함)

---

이어서: [05-template-guide.ko.md](./05-template-guide.ko.md) · [04-wakit-css.ko.md](./04-wakit-css.ko.md)
