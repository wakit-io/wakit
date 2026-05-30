# Hybrid UI Framework — Claude 컨텍스트

## 프로젝트 개요

**wakit** 기반의 하이브리드 웹앱 프레임워크. 한 벌의 HTML/CSS/JS로 웹과 앱(Capacitor 패키징)을 동시에 제공하는 구조.

**핵심 구성:**
- `wakit/` — SPA 엔진 (라우팅, 탭, 트랜지션, 테마, 다크모드)
- `templates/` — 프로젝트 단위 템플릿 (각각 독립적인 앱)
- `supabase/` — Supabase 로컬 개발 환경 + 마이그레이션

---

## 템플릿 구조 (templates/{name}/)

```
templates/{name}/
├── app.html              ← wakit SPA 진입점 (Supabase CDN 로드, window.sb 초기화)
├── wakitConfig.json      ← 탭·라우트·테마 설정
├── views/                ← 뷰 HTML 파일 (라우트별)
├── css/                  ← 뷰별 CSS
├── js/                   ← theme-toggle.js 등
├── wakit-components/     ← appbar.html, tabbar.html, appheader.html, splash.html
├── manifest.json         ← PWA 설정
└── web/                  ← Astro 웹 레이어 (랜딩페이지, SEO)
    ├── src/pages/        ← Astro 페이지 (/, /board 등)
    ├── public/           ← 빌드 시 자동 채워짐 (건드리지 말 것)
    ├── astro.config.mjs  ← compressHTML: false, vite 미들웨어 (dev 시 /app, /wakit 서빙)
    └── dist/             ← 최종 빌드 결과물
```

**기준 템플릿:** `app_test` — 모든 새 템플릿은 이 기준으로 복사됨

---

## 빌드 파이프라인

```
npm run build:{name}
    ↓
webpack: wakit.js 난독화 → templates/{name}/web/public/wakit/
webpack: 앱 파일 복사   → templates/{name}/web/public/app/  (dist/, web/ 제외)
    ↓
astro build → templates/{name}/dist/  (배포 결과물)
```

**패키징 (판매용 ZIP):**
```
npm run package:{name}
→ packages/hybrid-ui-template-{name}-v1.0.0.zip
  ├── dist/           ← 웹 서버에 올릴 빌드 파일
  └── supabase/setup.sql ← DB 스키마 (템플릿명 포함된 마이그레이션 자동 수집)
```

---

## 개발 서버

```bash
npm run dev:{name}     # webpack dev server — http://localhost:5173/app/app.html
cd templates/{name}/web && npm run dev  # Astro dev — http://localhost:4321
```

---

## 템플릿 관리 자동화

```bash
npm run create:template   # 생성: 폴더 복사 + npm install + package.json 스크립트 자동 등록
npm run delete:template   # 삭제: 폴더 삭제 + package.json 스크립트 자동 제거
```

생성/삭제 시 `dev:{name}`, `build:{name}`, `package:{name}` 스크립트가 package.json에 자동 등록/제거됨.

---

## 핵심 규칙 (코딩 시 반드시 지킬 것)

### wakit 라우팅
- 페이지 이동은 반드시 `<a href="#routeName">` — `<button>` + JS navigate() 작동 안 함
- 라우트는 `wakitConfig.json`의 `tabs` 또는 `routes`에 등록해야 함

### wakit 스크립트
- views 내 `<script type="module">` 실행 불안정 — 반드시 일반 `<script>` 사용
- Supabase는 `app.html`에서 UMD CDN으로 로드 → `window.sb`로 전역 사용

### Supabase
- 로컬: `http://127.0.0.1:54321`, publishable key는 `supabase status`로 확인
- `raw_user_meta_data`는 RLS에 사용 금지 → `app_metadata` 사용
- 각 템플릿은 별도 스키마 사용 (예: `app_test.profiles`)

### webpack CopyWebpackPlugin
- `to` 경로는 반드시 `path.resolve(__dirname, ...)` 절대경로 사용
- 템플릿 파일 복사 시 `dist/**`, `web/**` 제외 필수

### CSS
- `appbarView: false` → `html.no-appbar` 클래스 적용됨
- safe-area는 `padding-top: env(safe-area-inset-top)` 방식 사용

---

## Supabase 연동 구조 (app_test 기준)

```javascript
// app.html
window.sb = supabase.createClient(
  'http://127.0.0.1:54321',
  'sb_publishable_...'
);
```

- Auth: `window.sb.auth.signUp()`, `window.sb.auth.signInWithPassword()`
- 회원가입 시 `app_test.handle_new_user()` 트리거로 profiles 자동 생성
- 스키마: `app_test.profiles` (id, username, email, created_at)

---

## 새 앱 생성 시 필요한 인풋

새 템플릿/앱 생성 요청 시 아래 정보를 받아 진행:
1. 앱 이름 (영문, 예: app_shop)
2. 브랜드 색상
3. 탭 메뉴 구성 (탭명, 아이콘, 페이지)
4. 뷰 목록 + 각 뷰 설명
5. Supabase 스키마 (테이블 구조) — 선택
6. 비즈니스 로직 설명 — 선택

---

## 주요 파일 위치

| 파일 | 역할 |
|------|------|
| `wakit/js/wakit.js` | SPA 코어 엔진 |
| `wakit/css/wakit.css` | 기본 스타일 |
| `webpack.config.js` | 빌드 설정 (난독화 + 복사) |
| `scripts/create-template.js` | 템플릿 생성 자동화 |
| `scripts/delete-template.js` | 템플릿 삭제 자동화 |
| `scripts/package-template.js` | 패키징 ZIP 자동화 |
| `docs/` | 상세 문서 (01~05) |
| `supabase/migrations/` | DB 스키마 마이그레이션 |

---

## 판매/배포 방식

- **프론트 템플릿 방식**: `dist/`만 납품, 구매자가 백엔드 직접 연동
- **Supabase 연동 버전**: `dist/` + `supabase/setup.sql` 납품, URL/Key만 교체하면 동작
- **SaaS/화이트라벨**: 서버에서 템플릿별 서브도메인 제공 + 구독료 수취 구조 가능
