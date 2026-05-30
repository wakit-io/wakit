# wakit.css — 변수·레이아웃·클래스

[English](./04-wakit-css.md) · **한국어**

WAKIT 앱 쉘과 뷰 전환에 필요한 기본 스타일을 정의합니다. 다크 모드, iOS/Android 전용, PWA 전용 탭바 등도 포함합니다.

## 1. CSS 변수 (:root)

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `--primary-color` | `#ffffff` | 강조/활성 색 (탭 활성 등). 테마에서 덮어씀 |
| `--bg` | `#ffffff` | 배경색 |
| `--text` | `#111111` | 기본 텍스트 색 |
| `--appbar-height` | `56px` | 앱바 높이 |
| `--tabbar-height` | `65px` | 탭바 높이 |
| `--transition` | `220ms ease` | 공통 전환 시간 |
| `--ios-ease` | `cubic-bezier(.25,.8,.25,1)` | iOS 전환 곡선 |
| `--ios-dur` | `520ms` | iOS 전환 시간 |
| `--ios-dur-fast` | `300ms` | iOS 짧은 전환 |
| `--ios-zfix` | `0.1px` | iOS 레이어 정렬용 z 보정 |
| `--parallax-shift` | `-60px` | (선택) 패럴랙스 강도 |
| `--tab-count` | (JS에서 설정) | iOS 탭바 글래스 슬라이더 너비 계산용 |

---

## 2. 리셋·기본

- `* { box-sizing: border-box }`
- `html, body`: `height: 100vh`, `margin: 0`, `background: var(--bg)`, `color: var(--text)`, 좌우 `env(safe-area-inset-*)` 패딩
- `a`: 밑줄 제거, 색 상속. 포커스/액티브/호버 시 outline·tap highlight 제거
- 모바일(768px 이하): `::-webkit-scrollbar { display: none }`

---

## 3. 앱바 (.appbar)

- **위치**: 상단 고정, `z-index: 10`. 상단 safe area 포함 높이 `calc(var(--appbar-height) + env(safe-area-inset-top))`
- **레이아웃**: flex, 좌측 영역(.appbar-left), 우측 영역(.appbar-right)
- **클래스**:
  - `.appbar.appheader`: 다이나믹 뷰 내부 헤더용, `z-index: 201`
  - `.appbar .title`, `.brand-name`: 제목/브랜드 스타일
  - `.appbar-button`: 버튼 패딩
- **데스크톱**: `.desktop-mode .appbar` → `display: none`

---

## 4. 탭바 (.tabbar)

- **위치**: 하단 고정. 높이 `calc(var(--tabbar-height) + env(safe-area-inset-bottom))`, 상단 border, 반투명 배경 + backdrop-filter
- **탭 링크**: flex, 세로 정렬, 아이콘+텍스트. `.tabbar a.active` → `color: var(--primary-color)`, `font-weight: 600`
- **iOS 전용** (`.ios .tabbar`):
  - 하단 여백, 둥근 박스, 글래스 스타일
  - `::before`로 글래스 슬라이더(활성 탭 위치). `--glass-slider-x`, `--tab-count` 사용
  - `.tabbar a .icon.tab-click-animate`: 클릭 시 `tabIconBounce` 애니메이션
- **숨김**: `.tabbar.hide` → `transform: translateY(100%)`
- **데스크톱**: `.desktop-mode .tabbar` → `display: none`
- **PWA 전용**: `.tabbar-pwa-only:not(.pwa-mode) .tabbar` → 숨김. `.tabbar-pwa-only.pwa-mode .tabbar` → 표시

---

## 5. 뷰 컨테이너 (.views / .view)

- **.views**: 탭/페이지가 들어가는 컨테이너.  
  - 데스크톱: `min-height: 100dvh`, overflow auto  
  - 모바일: 상단 패딩 `calc(var(--appbar-height) + env(safe-area-inset-top))`, 하단 패딩 `calc(var(--tabbar-height) + env(safe-area-inset-bottom))`, `min-height: 100vh`
- **.view**: 개별 탭 뷰. `position: absolute`, `inset: 0`, 기본 `opacity: 0`, `pointer-events: none`
- **.view.active**: `opacity: 1`, `transform: translateX(0)`, `pointer-events: auto`, `z-index: 2`
- **방향 전환**: `.view.anim-in-right`, `.view.anim-in-left`, `.view.anim-out-right`, `.view.anim-out-left` (translateX ±24px)
- **.view .page**: 모바일에서 앱바/탭바 높이만큼 padding. **.no-tabbar** 시 하단 패딩 제거

---

## 6. 다이나믹 뷰 (.dynamic-view)

- **CSS 격리**: SPA에서 다이나믹 뷰로 전환 시 페이지별 CSS가 head에 주입됩니다. 동일 클래스명으로 인해 이전 페이지(A) 스타일이 다음 페이지(B)에 적용되는 것을 막기 위해, wakit.js는 다이나믹 뷰용 링크/스타일을 `data-wakit-dynamic-view`·`data-wakit-view-path`로 표시하고, **해당 뷰가 닫힐 때** 그 뷰의 스타일만 head에서 제거합니다. 따라서 현재 보이는 다이나믹 뷰의 스타일만 유효하고, 뒤로 가기 시 이전 뷰 스타일이 다시 적용됩니다.
- **기본**: `position: fixed`, `width: 100%`, `min-height: 100vh`, 오른쪽에서 슬라이드(`transform: translateX(100%)`), `z-index: 150`대
- **.dynamic-view .page**: 헤더 아래 콘텐츠 영역. 상단 패딩, `height: 100vh`, `overflow: auto`
- **백드롭**: `.dynamic-view-backdrop` — 반투명 검정. `.show` 시 표시. z-index 149
- **로딩**: `.dynamic-loading` — 전체 화면 로딩. `.show` 시 표시. 내부 `.spinner` 애니메이션
- **iOS**:  
  - 슬라이드 전환 시간/곡선 통일, `translate3d` + `--ios-zfix`  
  - `.dynamic-view.active` / `.closing` 상태  
  - body/appbar/tabbar가 `.dynamic-active`일 때 왼쪽으로 이동 (`.dv-shift-left`)
- **Android**:  
  - `.android-animation-scale`: scale + opacity  
  - `.android-animation-slide`: translateY + opacity
- **iOS 타입별**: `.ios-animation-slide`, `.ios-animation-scale`, `.ios-animation-fade`
- **제스처 중**: `html.no-gesture-anim` 시 전환/애니메이션 제거, zFix만 유지

---

## 7. 오프캔버스 (.offcanvas)

- **.offcanvas**: 좌/우 고정, `width: min(80%, 320px)`, 상하 safe area 패딩
- **.offcanvas.right** / **.offcanvas.left**: 각각 오른쪽/왼쪽에서 슬라이드. `.open` 시 `transform: translateX(0)`
- **.offcanvas-backdrop**: 전체 화면 반투명. `.show` 시 표시. `z-index: 199`

---

## 8. Pull-to-Refresh (.pull-to-refresh)

- 앱바 바로 아래에 위치. `.ptr-indicator`, `.spinner` 스타일
- z-index 201

---

## 9. 스플래시·온보딩·인트로

- **.splash-overlay**: 전체 화면, `z-index: 300`. `.show` / `.hide`로 표시 제어
- **.onboarding-overlay**, **.intro-overlay**: `z-index: 301`, 302. `.show` / `.hide`로 표시

---

## 10. 모드·디바이스 클래스

| 클래스 | 적용 시점 | 효과 |
|--------|-----------|------|
| `.desktop-mode` | 데스크톱 | 앱바·탭바 숨김, .views 패딩 조정 |
| `.mobile-mode` | 모바일 | 뷰 패딩, body 전환, PTR/스와이프 등 |
| `.ios` | iOS | 탭바·다이나믹뷰 전용 스타일, safe area |
| `.android` | Android | 다이나믹 뷰 scale/slide 스타일 |
| `.no-tabbar` | 탭바 없음 | .views 하단 패딩 제거 |
| `.pwa-mode` | PWA로 실행 | 탭바 PWA 전용 표시 시 사용 |

---

## 11. 다크 모드 ([data-theme="dark"])

- 루트 또는 상위에 `data-theme="dark"` 지정 시:
  - `--primary-color`, `--bg`, `--text` 덮어씀
  - `.appbar`, `.tabbar`, `.offcanvas`, `.dynamic-view`, `.dynamic-view-backdrop`, `.dynamic-loading`, `.pull-to-refresh .spinner`, 스플래시/온보딩/인트로 배경 등이 어두운 색으로 변경

---

## 12. iOS 안정화 오버라이드

- `.dynamic-view`, `.appbar`, `.tabbar`: `backface-visibility: hidden`, `contain: layout paint style`, `isolation: isolate`로 레이어 분리
- iOS 슬라이드 전환은 `--ios-dur`, `--ios-ease`, `--ios-zfix`로 통일
- `html.no-gesture-anim` 시 전환·애니메이션 제거로 제스처 중 깜빡임 방지

---

이상이 wakit.css의 1차 정리입니다. 웹 문서 사이트에서는 목차 링크로 [01-overview](./01-overview.ko.md) ~ [04-wakit-css](./04-wakit-css.ko.md)를 연결해 사용하면 됩니다.
