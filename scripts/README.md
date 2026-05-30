# 자동화 스크립트

비즈니스 효율성을 높이기 위한 자동화 스크립트 모음입니다.

## 스크립트 목록

### 1. `package-template.js`
템플릿 패키징 자동화 스크립트

**사용법:**
```bash
npm run package
TEMPLATE=blog npm run package
```

**기능:**
- 템플릿 빌드
- 패키지 파일 생성
- 패키지 정보 및 문서 자동 생성

### 2. `create-customization-project.js`
커스터마이징 프로젝트 생성 스크립트

**사용법:**
```bash
npm run create:custom
```

**기능:**
- 고객별 프로젝트 구조 생성
- 작업 로그 템플릿 생성
- 개발 환경 설정

### 3. `create-cms-project.js`
CMS 연동 프로젝트 생성 스크립트

**사용법:**
```bash
npm run create:cms
```

**기능:**
- 프론트엔드/백엔드 구조 생성
- 프로젝트 계획서 생성
- 개발 환경 설정

## 실행 권한 설정

스크립트 실행 권한이 필요한 경우:

```bash
chmod +x scripts/*.js
```

## 요구사항

- Node.js 14 이상
- npm 또는 yarn

## 문제 해결

스크립트 실행 시 오류가 발생하면:

1. Node.js 버전 확인: `node --version`
2. 의존성 설치: `npm install`
3. 스크립트 파일 권한 확인
