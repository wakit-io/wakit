#!/usr/bin/env node
/**
 * 템플릿 패키징 자동화 스크립트
 * 빌드 결과물 + Supabase 마이그레이션 포함하여 패키징
 *
 * 사용법:
 *   TEMPLATE=app_test node scripts/package-template.js
 *   npm run package:app_test
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TEMPLATE_NAME = process.env.TEMPLATE || 'app_test';
const ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT, 'packages');
const TEMPLATE_SRC = path.join(ROOT, 'templates', TEMPLATE_NAME);
const DIST_SRC = path.join(TEMPLATE_SRC, 'dist');
const MIGRATIONS_SRC = path.join(ROOT, 'supabase', 'migrations');

const packageInfo = {
  name: `hybrid-ui-template-${TEMPLATE_NAME}`,
  version: '1.0.0',
  description: `Hybrid UI Framework Template - ${TEMPLATE_NAME}`,
  license: 'Commercial',
  createdAt: new Date().toISOString(),
};

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function getDirSize(dir) {
  let size = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    size += entry.isDirectory() ? getDirSize(p) : fs.statSync(p).size;
  }
  return size;
}

function collectMigrations() {
  if (!fs.existsSync(MIGRATIONS_SRC)) return [];
  return fs.readdirSync(MIGRATIONS_SRC)
    .filter(f => f.endsWith('.sql') && f.includes(TEMPLATE_NAME))
    .sort();
}

function generateSetupSql(migrations) {
  if (migrations.length === 0) return null;
  const parts = migrations.map(f =>
    `-- ${f}\n${fs.readFileSync(path.join(MIGRATIONS_SRC, f), 'utf8')}`
  );
  return parts.join('\n\n');
}

function generateReadme(setupSql) {
  const hasDb = !!setupSql;
  return `# ${packageInfo.name}

${packageInfo.description}

## 파일 구성

\`\`\`
dist/        ← 웹 서버에 업로드할 빌드 파일
${hasDb ? 'supabase/    ← Supabase DB 스키마\n' : ''}\`\`\`

## 설치 방법

### 1. 프론트엔드 배포

\`dist/\` 폴더 내용을 웹 호스팅에 업로드합니다.
${hasDb ? `
### 2. Supabase 세팅

1. [supabase.com](https://supabase.com)에서 새 프로젝트 생성
2. Supabase 대시보드 → SQL Editor → \`supabase/setup.sql\` 내용 붙여넣기 후 실행
3. \`dist/app/app.html\` 파일에서 아래 두 값을 본인 프로젝트 값으로 교체

\`\`\`html
window.sb = supabase.createClient(
  'https://YOUR_PROJECT.supabase.co',  ← 본인 URL로 교체
  'YOUR_ANON_KEY'                       ← 본인 anon key로 교체
);
\`\`\`

Supabase 프로젝트 URL과 anon key는 대시보드 → Settings → API에서 확인할 수 있습니다.
` : ''}
## 라이선스

상업적 라이선스 — 단일 프로젝트 사용, 재판매 금지.
`;
}

function generateLicense() {
  return `HYBRID UI FRAMEWORK TEMPLATE - COMMERCIAL LICENSE

Copyright (c) ${new Date().getFullYear()} All rights reserved.

사용 조건:
- 단일 프로젝트에만 사용 가능
- 재판매 및 재배포 금지
- 소스 코드 커스터마이징 가능
`;
}

function createPackage() {
  console.log(`\n📦 패키징 시작: ${TEMPLATE_NAME}\n`);

  // 빌드
  console.log('🔨 빌드 중...');
  execSync(`npm run build:${TEMPLATE_NAME}`, { cwd: ROOT, stdio: 'inherit' });

  // dist 확인
  if (!fs.existsSync(DIST_SRC)) {
    throw new Error(`빌드 결과물이 없습니다: ${DIST_SRC}`);
  }

  // 출력 폴더 준비
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const packageDir = path.join(OUTPUT_DIR, `${packageInfo.name}-v${packageInfo.version}`);
  if (fs.existsSync(packageDir)) fs.rmSync(packageDir, { recursive: true });
  fs.mkdirSync(packageDir);

  // dist 복사
  console.log('📋 빌드 파일 복사 중...');
  copyDir(DIST_SRC, path.join(packageDir, 'dist'));

  // Supabase 마이그레이션 수집 및 통합 SQL 생성
  const migrations = collectMigrations();
  let setupSql = null;
  if (migrations.length > 0) {
    setupSql = generateSetupSql(migrations);
    const supabaseDir = path.join(packageDir, 'supabase');
    fs.mkdirSync(supabaseDir);
    fs.writeFileSync(path.join(supabaseDir, 'setup.sql'), setupSql);
    console.log(`📄 Supabase 스키마 포함: ${migrations.length}개 마이그레이션`);
    migrations.forEach(f => console.log(`   - ${f}`));
  } else {
    console.log('ℹ️  Supabase 마이그레이션 없음 (프론트만 패키징)');
  }

  // 부가 파일 생성
  fs.writeFileSync(path.join(packageDir, 'package-info.json'), JSON.stringify(packageInfo, null, 2));
  fs.writeFileSync(path.join(packageDir, 'README.md'), generateReadme(setupSql));
  fs.writeFileSync(path.join(packageDir, 'LICENSE.txt'), generateLicense());

  // zip 생성
  const zipName = `${packageInfo.name}-v${packageInfo.version}.zip`;
  const zipPath = path.join(OUTPUT_DIR, zipName);
  if (fs.existsSync(zipPath)) fs.rmSync(zipPath);
  execSync(`cd "${OUTPUT_DIR}" && zip -r "${zipName}" "${path.basename(packageDir)}"`, { stdio: 'pipe' });

  const sizeMB = (getDirSize(packageDir) / 1024 / 1024).toFixed(2);
  console.log(`\n✅ 패키징 완료!`);
  console.log(`📁 폴더: ${packageDir}`);
  console.log(`🗜️  ZIP:  ${zipPath}`);
  console.log(`📦 크기: ${sizeMB} MB`);
}

try {
  createPackage();
} catch (err) {
  console.error('\n❌ 패키징 실패:', err.message);
  process.exit(1);
}
