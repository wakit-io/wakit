# 작업 자동화 가이드

비즈니스 효율성을 높이기 위한 자동화 스크립트 및 워크플로우 가이드입니다.

## 📦 1. 템플릿 패키징 자동화

디지털 파일 판매용 템플릿을 자동으로 패키징합니다.

### 사용법

```bash
# 기본 템플릿 (blog) 패키징
npm run package

# 특정 템플릿 패키징
npm run package:blog
TEMPLATE=shop npm run package
```

### 생성되는 파일

- `packages/hybrid-ui-template-{name}-v{version}/`
  - 빌드된 템플릿 파일
  - package-info.json (패키지 정보)
  - README.md (사용 가이드)
  - LICENSE.txt (라이선스)

### 활용 시나리오

1. **템플릿 판매 전 준비**
   - 고객에게 전달할 패키지 생성
   - 버전 관리 및 배포

2. **업데이트 배포**
   - 버전 업데이트 후 자동 패키징
   - 변경사항 문서화

## 🎨 2. 커스터마이징 프로젝트 생성 자동화

고객별 커스터마이징 작업을 위한 프로젝트를 자동으로 생성합니다.

### 사용법

```bash
npm run create:custom
```

### 생성되는 구조

```
projects/{project-name}/
├── src/                    # 템플릿 소스 파일
├── package.json            # 프로젝트 설정
├── webpack.config.js       # 빌드 설정
├── project.json            # 프로젝트 메타데이터
├── work-log.md             # 작업 로그
└── README.md               # 프로젝트 가이드
```

### 활용 시나리오

1. **새 고객 커스터마이징 작업 시작**
   - 프로젝트 구조 자동 생성
   - 작업 로그 템플릿 제공
   - 일관된 프로젝트 구조 유지

2. **작업 효율성 향상**
   - 반복적인 설정 작업 제거
   - 표준화된 작업 프로세스

## 🚀 3. CMS 연동 프로젝트 생성 자동화

실사화 작업을 위한 CMS 연동 프로젝트 구조를 자동으로 생성합니다.

### 사용법

```bash
npm run create:cms
```

### 생성되는 구조

```
projects/{project-name}/
├── frontend/               # 프론트엔드 (템플릿 기반)
│   ├── src/
│   └── package.json
├── backend/                 # 백엔드 API 서버
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   ├── server.js
│   └── package.json
├── database/                # 데이터베이스 스키마
├── docs/                    # 문서
├── scripts/                 # 유틸리티 스크립트
├── tests/                   # 테스트 파일
├── project.json             # 프로젝트 메타데이터
├── project-plan.md          # 프로젝트 계획서
└── README.md                # 프로젝트 가이드
```

### 활용 시나리오

1. **CMS 연동 프로젝트 시작**
   - 프론트엔드/백엔드 구조 자동 생성
   - 프로젝트 계획서 템플릿 제공
   - 표준화된 프로젝트 구조

2. **작업 효율성 향상**
   - 초기 설정 시간 단축
   - 일관된 아키텍처 유지

## 🔄 4. 자동화 워크플로우

### 템플릿 판매 워크플로우

```
1. 템플릿 개발/수정
   ↓
2. npm run package (자동 패키징)
   ↓
3. packages/ 폴더에서 패키지 확인
   ↓
4. 고객에게 전달 또는 마켓플레이스 업로드
```

### 커스터마이징 작업 워크플로우

```
1. 고객 요청 접수
   ↓
2. npm run create:custom (프로젝트 생성)
   ↓
3. 프로젝트 정보 입력
   ↓
4. work-log.md에 요구사항 기록
   ↓
5. 커스터마이징 작업 진행
   ↓
6. 테스트 및 고객 전달
```

### CMS 연동 프로젝트 워크플로우

```
1. CMS 연동 프로젝트 수주
   ↓
2. npm run create:cms (프로젝트 생성)
   ↓
3. 프로젝트 정보 입력 (CMS 타입, 기능 등)
   ↓
4. project-plan.md 확인 및 작업 계획 수립
   ↓
5. 백엔드 개발 → 프론트엔드 연동 → 테스트 → 배포
```

## 📊 5. 추가 자동화 아이디어

### 5.1. 배포 자동화

```bash
# 배포 스크립트 예시
npm run deploy:staging    # 스테이징 환경 배포
npm run deploy:production # 프로덕션 환경 배포
```

### 5.2. 테스트 자동화

```bash
# 테스트 스크립트 예시
npm run test              # 전체 테스트 실행
npm run test:unit         # 유닛 테스트
npm run test:e2e          # E2E 테스트
```

### 5.3. 문서 생성 자동화

```bash
# 문서 생성 스크립트 예시
npm run docs:generate     # API 문서 자동 생성
npm run docs:update       # 문서 업데이트
```

### 5.4. 코드 품질 검사 자동화

```bash
# 코드 품질 검사 스크립트 예시
npm run lint              # 코드 린팅
npm run format            # 코드 포맷팅
npm run check             # 코드 품질 검사
```

## 🎯 6. 효율성 향상 효과

### 시간 절감

- **템플릿 패키징**: 수동 작업 30분 → 자동화 2분 (93% 절감)
- **프로젝트 생성**: 수동 작업 1시간 → 자동화 5분 (92% 절감)
- **CMS 프로젝트 생성**: 수동 작업 2시간 → 자동화 10분 (92% 절감)

### 품질 향상

- 일관된 프로젝트 구조
- 표준화된 작업 프로세스
- 실수 방지 (자동화로 인한)

### 확장성

- 새로운 프로젝트 빠른 시작
- 여러 프로젝트 동시 관리 용이
- 팀 협업 효율성 향상

## 📝 7. 사용 예시

### 예시 1: 템플릿 판매 준비

```bash
# 1. 템플릿 수정 완료
# 2. 패키징 실행
npm run package:blog

# 3. packages/ 폴더 확인
ls packages/

# 4. 패키지 압축 및 배포 준비
cd packages
zip -r hybrid-ui-template-blog-v1.0.0.zip hybrid-ui-template-blog-v1.0.0/
```

### 예시 2: 커스터마이징 작업 시작

```bash
# 1. 프로젝트 생성
npm run create:custom

# 2. 정보 입력
프로젝트 이름: client-abc-customization
고객명: ABC Company
프로젝트 타입: web
설명: 로고 및 색상 변경

# 3. 프로젝트 폴더로 이동
cd projects/client-abc-customization

# 4. 개발 시작
npm install
npm run dev
```

### 예시 3: CMS 연동 프로젝트 시작

```bash
# 1. 프로젝트 생성
npm run create:cms

# 2. 정보 입력
프로젝트 이름: client-xyz-cms
고객명: XYZ Corp
CMS 타입: strapi
결제 시스템 연동 필요? y
인증 시스템 필요? y

# 3. 프로젝트 계획 확인
cat projects/client-xyz-cms/project-plan.md

# 4. 작업 시작
cd projects/client-xyz-cms
cd backend && npm install
cd ../frontend && npm install
```

## 🔧 8. 스크립트 커스터마이징

각 스크립트는 프로젝트 요구사항에 맞게 수정 가능합니다:

- `scripts/package-template.js`: 패키징 로직 수정
- `scripts/create-customization-project.js`: 프로젝트 구조 수정
- `scripts/create-cms-project.js`: CMS 프로젝트 구조 수정

## 📚 9. 참고사항

- 모든 스크립트는 Node.js 환경에서 실행됩니다
- 프로젝트 생성 시 기존 프로젝트는 덮어쓰기 전 확인합니다
- 패키징 전 빌드가 완료되었는지 확인하세요
- 프로젝트별 작업 로그는 `work-log.md`에 기록하세요

## 🚀 10. 향후 개선 사항

- [ ] CI/CD 파이프라인 구축
- [ ] 자동 테스트 통합
- [ ] 배포 자동화 스크립트
- [ ] 모니터링 및 알림 시스템
- [ ] 프로젝트 템플릿 확장
