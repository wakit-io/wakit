#!/usr/bin/env node
/**
 * CMS 연동 프로젝트 생성 자동화 스크립트
 * 실사화 작업을 위한 프로젝트 구조 생성
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const PROJECTS_DIR = path.resolve(__dirname, '../projects');
const TEMPLATE_SRC = path.resolve(__dirname, '../templates/blog');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function createCMSProject() {
  console.log('🚀 CMS 연동 프로젝트 생성\n');
  
  // 프로젝트 정보 입력
  const projectName = await question('프로젝트 이름: ');
  const clientName = await question('고객명: ');
  const cmsType = await question('CMS 타입 (wordpress/strapi/custom): ') || 'custom';
  const hasPayment = await question('결제 시스템 연동 필요? (y/n): ');
  const hasAuth = await question('인증 시스템 필요? (y/n): ');
  
  // 프로젝트 디렉토리 생성
  const projectDir = path.join(PROJECTS_DIR, projectName);
  if (fs.existsSync(projectDir)) {
    const overwrite = await question(`프로젝트가 이미 존재합니다. 덮어쓰시겠습니까? (y/n): `);
    if (overwrite.toLowerCase() !== 'y') {
      console.log('❌ 취소되었습니다.');
      rl.close();
      return;
    }
    fs.rmSync(projectDir, { recursive: true });
  }
  
  fs.mkdirSync(projectDir, { recursive: true });
  
  // 프로젝트 구조 생성
  console.log('\n📋 프로젝트 구조 생성 중...');
  createProjectStructure(projectDir, {
    name: projectName,
    client: clientName,
    cmsType: cmsType,
    hasPayment: hasPayment.toLowerCase() === 'y',
    hasAuth: hasAuth.toLowerCase() === 'y'
  });
  
  // 템플릿 복사
  console.log('📋 템플릿 파일 복사 중...');
  copyTemplate(projectDir);
  
  // 백엔드 구조 생성
  console.log('🔧 백엔드 구조 생성 중...');
  createBackendStructure(projectDir, cmsType);
  
  // 프로젝트 설정 파일 생성
  const projectConfig = {
    name: projectName,
    client: clientName,
    type: 'cms-integration',
    cmsType: cmsType,
    features: {
      payment: hasPayment.toLowerCase() === 'y',
      auth: hasAuth.toLowerCase() === 'y'
    },
    createdAt: new Date().toISOString(),
    status: 'planning',
    version: '1.0.0'
  };
  
  fs.writeFileSync(
    path.join(projectDir, 'project.json'),
    JSON.stringify(projectConfig, null, 2)
  );
  
  // 작업 계획서 생성
  const planFile = path.join(projectDir, 'project-plan.md');
  const planContent = generateProjectPlan(projectConfig);
  fs.writeFileSync(planFile, planContent);
  
  // README 생성
  const readme = generateCMSReadme(projectConfig);
  fs.writeFileSync(path.join(projectDir, 'README.md'), readme);
  
  console.log('\n✅ CMS 프로젝트 생성 완료!');
  console.log(`📁 위치: ${projectDir}`);
  console.log(`\n다음 단계:`);
  console.log(`1. project-plan.md를 확인하고 작업 계획을 수립하세요`);
  console.log(`2. backend/ 폴더에서 API 개발을 시작하세요`);
  console.log(`3. frontend/ 폴더에서 프론트엔드 연동을 진행하세요`);
  
  rl.close();
}

function createProjectStructure(projectDir, config) {
  const dirs = [
    'frontend',
    'backend',
    'database',
    'docs',
    'scripts',
    'tests'
  ];
  
  dirs.forEach(dir => {
    fs.mkdirSync(path.join(projectDir, dir), { recursive: true });
  });
}

function copyTemplate(projectDir) {
  const frontendDir = path.join(projectDir, 'frontend');
  copyDir(TEMPLATE_SRC, frontendDir);
  
  // package.json 생성
  const packageJson = {
    name: `${config.name}-frontend`,
    version: '1.0.0',
    private: true,
    scripts: {
      dev: 'webpack serve --mode development --env template=blog',
      build: 'webpack --mode production --env template=blog',
      preview: 'npx serve dist -l 5173'
    },
    dependencies: {
      'axios': '^1.6.0'
    },
    devDependencies: {
      'copy-webpack-plugin': '^12.0.2',
      'terser': '^5.31.0',
      'webpack': '^5.91.0',
      'webpack-cli': '^5.1.4',
      'webpack-dev-server': '^4.15.1'
    }
  };
  
  fs.writeFileSync(
    path.join(frontendDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
}

function createBackendStructure(projectDir, cmsType) {
  const backendDir = path.join(projectDir, 'backend');
  
  // API 구조 생성
  const apiDirs = ['routes', 'controllers', 'models', 'middleware', 'utils'];
  apiDirs.forEach(dir => {
    fs.mkdirSync(path.join(backendDir, dir), { recursive: true });
  });
  
  // 기본 파일 생성
  const serverJs = `const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS 설정
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(\`Server running on http://localhost:\${PORT}\`);
});
`;
  
  fs.writeFileSync(path.join(backendDir, 'server.js'), serverJs);
  
  // package.json 생성
  const backendPackageJson = {
    name: `${config.name}-backend`,
    version: '1.0.0',
    private: true,
    scripts: {
      start: 'node server.js',
      dev: 'nodemon server.js'
    },
    dependencies: {
      'express': '^4.18.2',
      'cors': '^2.8.5',
      'dotenv': '^16.3.1'
    },
    devDependencies: {
      'nodemon': '^3.0.1'
    }
  };
  
  fs.writeFileSync(
    path.join(backendDir, 'package.json'),
    JSON.stringify(backendPackageJson, null, 2)
  );
  
  // .env.example 생성
  const envExample = `PORT=3000
NODE_ENV=development
DATABASE_URL=
JWT_SECRET=
API_KEY=
`;
  fs.writeFileSync(path.join(backendDir, '.env.example'), envExample);
}

function generateProjectPlan(config) {
  return `# ${config.name} - 프로젝트 계획서

## 프로젝트 정보
- 고객: ${config.client}
- 타입: CMS 연동 프로젝트
- CMS: ${config.cmsType}
- 시작일: ${new Date().toLocaleDateString('ko-KR')}

## 기능 요구사항

### 필수 기능
- [ ] 프론트엔드 템플릿 적용
- [ ] CMS API 연동
- [ ] 데이터베이스 설계 및 구축
- [ ] 관리자 페이지 구축

### 추가 기능
${config.features.payment ? '- [ ] 결제 시스템 연동' : ''}
${config.features.auth ? '- [ ] 인증/권한 관리 시스템' : ''}

## 작업 단계

### 1단계: 기획 및 설계 (1-2주)
- [ ] 요구사항 분석
- [ ] 데이터베이스 설계
- [ ] API 설계
- [ ] UI/UX 리뷰

### 2단계: 백엔드 개발 (3-4주)
- [ ] API 서버 구축
- [ ] 데이터베이스 구축
- [ ] 인증 시스템 개발
${config.features.payment ? '- [ ] 결제 시스템 연동' : ''}

### 3단계: 프론트엔드 연동 (2-3주)
- [ ] API 연동
- [ ] 데이터 바인딩
- [ ] 상태 관리
- [ ] 에러 처리

### 4단계: 관리자 페이지 (2-3주)
- [ ] CMS 구축
- [ ] 콘텐츠 관리 기능
- [ ] 사용자 관리
- [ ] 통계 대시보드

### 5단계: 테스트 및 배포 (1-2주)
- [ ] 기능 테스트
- [ ] 성능 테스트
- [ ] 보안 검토
- [ ] 배포 및 호스팅 설정

## 기술 스택

### Frontend
- Hybrid UI Framework Template
- Wakit (하이브리드 앱 엔진)
- Axios (API 통신)

### Backend
- Node.js + Express
- ${config.cmsType === 'strapi' ? 'Strapi CMS' : 'Custom CMS'}
- Database: [선택 필요]

### Infrastructure
- Server: [선택 필요]
- Hosting: [선택 필요]
- Domain: [선택 필요]

## 예상 일정
총 작업 기간: 9-14주 (약 2-3.5개월)

## 예상 비용
- 개발 비용: [계산 필요]
- 인프라 비용: [계산 필요]
- 유지보수: [계산 필요]

## 참고사항
[추가 참고사항을 여기에 작성]
`;
}

function generateCMSReadme(config) {
  return `# ${config.name}

CMS 연동 프로젝트

## 프로젝트 구조

\`\`\`
${config.name}/
├── frontend/          # 프론트엔드 (템플릿 기반)
├── backend/           # 백엔드 API 서버
├── database/          # 데이터베이스 스키마 및 마이그레이션
├── docs/              # 문서
├── scripts/           # 유틸리티 스크립트
└── tests/             # 테스트 파일
\`\`\`

## 시작하기

### 프론트엔드
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

### 백엔드
\`\`\`bash
cd backend
npm install
cp .env.example .env
# .env 파일 수정
npm run dev
\`\`\`

## 작업 가이드

1. \`project-plan.md\`를 확인하고 작업 계획을 수립하세요
2. 각 단계별로 작업을 진행하세요
3. \`docs/\` 폴더에 작업 문서를 작성하세요

## 배포

각 환경별 배포 가이드는 \`docs/deployment.md\`를 참고하세요.
`;
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    throw new Error(`Source directory does not exist: ${src}`);
  }
  
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') {
      continue;
    }
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 실행
createCMSProject().catch((error) => {
  console.error('❌ 프로젝트 생성 실패:', error.message);
  rl.close();
  process.exit(1);
});
