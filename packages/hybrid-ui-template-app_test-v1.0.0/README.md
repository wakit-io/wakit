# hybrid-ui-template-app_test

Hybrid UI Framework Template - app_test

## 파일 구성

```
dist/        ← 웹 서버에 업로드할 빌드 파일
supabase/    ← Supabase DB 스키마
```

## 설치 방법

### 1. 프론트엔드 배포

`dist/` 폴더 내용을 웹 호스팅에 업로드합니다.

### 2. Supabase 세팅

1. [supabase.com](https://supabase.com)에서 새 프로젝트 생성
2. Supabase 대시보드 → SQL Editor → `supabase/setup.sql` 내용 붙여넣기 후 실행
3. `dist/app/app.html` 파일에서 아래 두 값을 본인 프로젝트 값으로 교체

```html
window.sb = supabase.createClient(
  'https://YOUR_PROJECT.supabase.co',  ← 본인 URL로 교체
  'YOUR_ANON_KEY'                       ← 본인 anon key로 교체
);
```

Supabase 프로젝트 URL과 anon key는 대시보드 → Settings → API에서 확인할 수 있습니다.

## 라이선스

상업적 라이선스 — 단일 프로젝트 사용, 재판매 금지.
