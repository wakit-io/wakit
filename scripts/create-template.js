#!/usr/bin/env node
/**
 * 새 템플릿 생성 스크립트
 * 템플릿 폴더 구조 생성 + Supabase 스키마 + 스토리지 버킷 자동 생성
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const TEMPLATES_DIR = path.join(ROOT, 'templates');
const BASE_TEMPLATE = path.join(TEMPLATES_DIR, 'app_basic'); // 골든 base 템플릿

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function question(prompt) {
  return new Promise(resolve => rl.question(prompt, resolve));
}

function copyDir(src, dest, replaceName, newName) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (['node_modules', '.astro', 'dist'].includes(entry.name)) continue; // skip build artifacts
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, replaceName, newName);
    } else {
      let content = fs.readFileSync(srcPath, 'utf8');
      // Rebrand identity strings: underscore form (app_basic) and hyphen form
      // (app-basic-* BEM classes). newName is underscore (e.g. app_shop); its
      // hyphen form (app-shop) is used for class prefixes.
      const hyphenFrom = replaceName.replace(/_/g, '-');
      const hyphenTo = newName.replace(/_/g, '-');
      content = content.replace(new RegExp(replaceName, 'g'), newName);
      content = content.replace(new RegExp(hyphenFrom + '-', 'g'), `${hyphenTo}-`);
      content = content.replace(/app_basic-theme/g, `${newName}-theme`);
      fs.writeFileSync(destPath, content);
    }
  }
}

function createSchema(schemaName) {
  try {
    execSync(`supabase db query --local "CREATE SCHEMA IF NOT EXISTS ${schemaName};"`, { cwd: ROOT, stdio: 'pipe' });
    execSync(`supabase db query --local "GRANT USAGE ON SCHEMA ${schemaName} TO anon, authenticated;"`, { cwd: ROOT, stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function createBucket(bucketName) {
  try {
    const status = execSync('supabase status 2>/dev/null', { cwd: ROOT, encoding: 'utf8' });
    const serviceKey = (status.match(/sb_secret_\S+/) || [])[0];
    if (!serviceKey) return false;
    execSync(
      `curl -s -X POST "http://127.0.0.1:54321/storage/v1/bucket" \
        -H "Authorization: Bearer ${serviceKey}" \
        -H "apikey: ${serviceKey}" \
        -H "Content-Type: application/json" \
        -d '{"id":"${bucketName}","name":"${bucketName}","public":false}'`,
      { cwd: ROOT, stdio: 'pipe' }
    );
    return true;
  } catch {
    return false;
  }
}

function addMigration(schemaName) {
  const ts = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
  const migFile = path.join(ROOT, 'supabase', 'migrations', `${ts}_create_${schemaName}.sql`);
  const sql = [
    `-- ${schemaName} 스키마 생성`,
    `CREATE SCHEMA IF NOT EXISTS ${schemaName};`,
    `GRANT USAGE ON SCHEMA ${schemaName} TO anon, authenticated;`,
    ``,
    `-- ${schemaName} 스토리지 버킷 생성`,
    `INSERT INTO storage.buckets (id, name, public)`,
    `VALUES ('${schemaName}', '${schemaName}', false)`,
    `ON CONFLICT (id) DO NOTHING;`,
    ``,
  ].join('\n');
  fs.writeFileSync(migFile, sql);
  return migFile;
}

async function main() {
  console.log('\n🚀 새 템플릿 생성\n');

  const name = (await question('템플릿 이름 (예: app_shop): ')).trim();
  if (!name) { console.log('❌ 이름을 입력해주세요.'); rl.close(); return; }

  const templateDir = path.join(TEMPLATES_DIR, name);
  if (fs.existsSync(templateDir)) {
    console.log(`❌ 이미 존재하는 템플릿입니다: ${name}`);
    rl.close(); return;
  }

  const primaryColor = (await question('브랜드 색상 (기본값 #6366f1): ')).trim() || '#6366f1';
  const withDb = (await question('Supabase 스키마 + 버킷 자동 생성? (Y/n): ')).trim().toLowerCase() !== 'n';

  console.log('\n📁 템플릿 폴더 생성 중...');
  copyDir(BASE_TEMPLATE, templateDir, 'app_basic', name);

  // wakitConfig.json primaryColor 업데이트
  const configPath = path.join(templateDir, 'wakitConfig.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    config.theme.primaryColor = primaryColor;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  }

  console.log(`✅ 템플릿 생성 완료: templates/${name}/`);

  // package.json 스크립트 자동 추가
  const pkgPath = path.join(ROOT, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  pkg.scripts[`dev:${name}`] = `webpack serve --mode development --env template=${name}`;
  pkg.scripts[`build:${name}`] = `node scripts/build-template.js ${name}`;
  pkg.scripts[`package:${name}`] = `TEMPLATE=${name} node scripts/package-template.js`;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`✅ package.json 스크립트 추가: dev:${name}, build:${name}, package:${name}`);

  // Astro 의존성 설치 (web/ 폴더가 복사된 경우)
  const webDir = path.join(templateDir, 'web');
  if (fs.existsSync(webDir)) {
    console.log('📦 Astro 의존성 설치 중...');
    try {
      execSync('npm install', { cwd: webDir, stdio: 'pipe' });
      console.log('✅ Astro 의존성 설치 완료');
    } catch {
      console.log('⚠️  npm install 실패 - 수동으로 web/ 폴더에서 npm install 해주세요');
    }
  }

  if (withDb) {
    console.log('\n🗄️  Supabase 스키마 생성 중...');
    const schemaOk = createSchema(name);
    if (schemaOk) {
      console.log(`✅ 스키마 생성 완료: ${name}`);
    } else {
      console.log(`⚠️  스키마 적용 실패 (Supabase가 실행 중인지 확인해주세요)`);
    }

    console.log('📦 스토리지 버킷 생성 중...');
    const bucketOk = createBucket(name);
    if (bucketOk) {
      console.log(`✅ 버킷 생성 완료: ${name}`);
    } else {
      console.log(`⚠️  버킷 생성 실패`);
    }

    const migPath = addMigration(name);
    console.log(`📄 마이그레이션 파일: ${path.relative(ROOT, migPath)}`);
  }

  console.log(`\n🎉 완료! 개발 서버 실행:`);
  console.log(`   npm run dev:${name}`);
  console.log(`   접속: http://localhost:5173/app/app.html`);
  console.log(`\n웹 레이어 개발:`);
  console.log(`   cd templates/${name}/web && npm run dev\n`);

  rl.close();
}

main();
