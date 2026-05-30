#!/usr/bin/env node
/**
 * 커스터마이징 프로젝트 생성 자동화 스크립트
 * 고객별 커스터마이징 작업을 위한 프로젝트 생성
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const PROJECTS_DIR = path.resolve(__dirname, '../projects');
const TEMPLATE_SRC = path.resolve(__dirname, '../templates/app_basic');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function createCustomizationProject() {
  console.log('🎨 커스터마이징 프로젝트 생성\n');
  
  // 프로젝트 정보 입력
  const projectName = await question('프로젝트 이름: ');
  const clientName = await question('고객명: ');
  const projectType = await question('프로젝트 타입 (web/wakit): ') || 'web';
  const description = await question('설명 (선택): ') || '';
  
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
  
  // 템플릿 복사
  console.log('\n📋 템플릿 파일 복사 중...');
  copyTemplate(projectDir, projectType);
  
  // 프로젝트 설정 파일 생성
  const projectConfig = {
    name: projectName,
    client: clientName,
    type: projectType,
    description: description,
    createdAt: new Date().toISOString(),
    status: 'in-progress',
    version: '1.0.0'
  };
  
  fs.writeFileSync(
    path.join(projectDir, 'project.json'),
    JSON.stringify(projectConfig, null, 2)
  );
  
  // 작업 로그 파일 생성
  const logFile = path.join(projectDir, 'work-log.md');
  const logContent = `# ${projectName} - 작업 로그

## 프로젝트 정보
- 고객: ${clientName}
- 타입: ${projectType}
- 시작일: ${new Date().toLocaleDateString('ko-KR')}
- 설명: ${description}

## 작업 내역

### ${new Date().toLocaleDateString('ko-KR')}
- 프로젝트 생성
- 템플릿 파일 복사 완료

## 커스터마이징 요구사항

[고객 요구사항을 여기에 작성]

## 작업 체크리스트

- [ ] 디자인 리뷰
- [ ] 색상/폰트 변경
- [ ] 레이아웃 수정
- [ ] 기능 추가
- [ ] 테스트
- [ ] 배포

## 참고사항

[참고할 내용을 여기에 작성]
`;
  
  fs.writeFileSync(logFile, logContent);
  
  // README 생성
  const readme = generateProjectReadme(projectConfig);
  fs.writeFileSync(path.join(projectDir, 'README.md'), readme);
  
  // .gitignore 생성
  const gitignore = `node_modules/
dist/
.DS_Store
*.log
.env
`;
  fs.writeFileSync(path.join(projectDir, '.gitignore'), gitignore);
  
  console.log('\n✅ 프로젝트 생성 완료!');
  console.log(`📁 위치: ${projectDir}`);
  console.log(`\n다음 명령어로 개발 서버를 시작하세요:`);
  console.log(`cd ${projectDir}`);
  console.log(`npm run dev`);
  
  rl.close();
}

function copyTemplate(destDir, type) {
  // 템플릿 파일 복사
  copyDir(TEMPLATE_SRC, path.join(destDir, 'src'));
  
  // package.json 생성
  const packageJson = {
    name: `customization-project`,
    version: '1.0.0',
    private: true,
    scripts: {
      dev: 'webpack serve --mode development --env template=app_basic',
      build: 'webpack --mode production --env template=app_basic',
      preview: 'npx serve dist -l 5173'
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
    path.join(destDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
  
  // webpack.config.js 복사
  const webpackConfig = fs.readFileSync(
    path.resolve(__dirname, '../webpack.config.js'),
    'utf-8'
  );
  fs.writeFileSync(path.join(destDir, 'webpack.config.js'), webpackConfig);
  
  // wakit 심볼릭 링크 또는 복사
  const wakitSrc = path.resolve(__dirname, '../wakit');
  const wakitDest = path.join(destDir, 'wakit');
  copyDir(wakitSrc, wakitDest);
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
    
    // node_modules, dist 등 제외
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

function generateProjectReadme(config) {
  return `# ${config.name}

## 프로젝트 정보
- 고객: ${config.client}
- 타입: ${config.type}
- 상태: ${config.status}
- 생성일: ${new Date(config.createdAt).toLocaleDateString('ko-KR')}

## 설명
${config.description || '커스터마이징 프로젝트'}

## 시작하기

\`\`\`bash
npm install
npm run dev
\`\`\`

## 작업 가이드

1. \`src/\` 폴더에서 템플릿 파일 수정
2. \`work-log.md\`에 작업 내역 기록
3. 변경사항 테스트 후 고객에게 전달

## 배포

\`\`\`bash
npm run build
\`\`\`

빌드된 파일은 \`dist/\` 폴더에 생성됩니다.
`;
}

// 실행
createCustomizationProject().catch((error) => {
  console.error('❌ 프로젝트 생성 실패:', error.message);
  rl.close();
  process.exit(1);
});
