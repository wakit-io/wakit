#!/usr/bin/env node
/**
 * 템플릿 삭제 스크립트
 * 템플릿 폴더 삭제 + Supabase 스키마 + 스토리지 버킷 삭제
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const TEMPLATES_DIR = path.join(ROOT, 'templates');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function question(prompt) {
  return new Promise(resolve => rl.question(prompt, resolve));
}

function deleteDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function dropSchema(schemaName) {
  try {
    execSync(
      `supabase db query --local "DROP SCHEMA IF EXISTS ${schemaName} CASCADE;"`,
      { cwd: ROOT, stdio: 'pipe' }
    );
    return true;
  } catch {
    return false;
  }
}

function dropBucket(bucketName) {
  try {
    const status = execSync('supabase status 2>/dev/null', { cwd: ROOT, encoding: 'utf8' });
    const serviceKey = (status.match(/sb_secret_\S+/) || [])[0];
    if (!serviceKey) return false;
    execSync(
      `curl -s -X DELETE "http://127.0.0.1:54321/storage/v1/bucket/${bucketName}" -H "Authorization: Bearer ${serviceKey}" -H "apikey: ${serviceKey}"`,
      { cwd: ROOT, stdio: 'pipe' }
    );
    return true;
  } catch {
    return false;
  }
}

async function main() {
  console.log('\n🗑️  템플릿 삭제\n');

  // 현재 템플릿 목록 출력
  const templates = fs.readdirSync(TEMPLATES_DIR).filter(f =>
    fs.statSync(path.join(TEMPLATES_DIR, f)).isDirectory()
  );
  console.log('현재 템플릿 목록:');
  templates.forEach(t => console.log(`  - ${t}`));
  console.log('');

  const name = (await question('삭제할 템플릿 이름: ')).trim();
  if (!name) { console.log('❌ 이름을 입력해주세요.'); rl.close(); return; }

  const templateDir = path.join(TEMPLATES_DIR, name);
  if (!fs.existsSync(templateDir)) {
    console.log(`❌ 존재하지 않는 템플릿입니다: ${name}`);
    rl.close(); return;
  }

  const withDb = (await question(`Supabase 스키마 + 버킷(${name}) 도 삭제? (Y/n): `)).trim().toLowerCase() !== 'n';

  const confirm = (await question(`\n⚠️  정말 삭제하시겠습니까? (y/N): `)).trim().toLowerCase();
  if (confirm !== 'y') {
    console.log('❌ 취소됐어요.');
    rl.close(); return;
  }

  // 템플릿 폴더 삭제
  console.log('\n📁 템플릿 폴더 삭제 중...');
  deleteDir(templateDir);
  console.log(`✅ 템플릿 삭제 완료: templates/${name}/`);

  // package.json 스크립트 자동 제거
  const pkgPath = path.join(ROOT, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  delete pkg.scripts[`dev:${name}`];
  delete pkg.scripts[`build:${name}`];
  delete pkg.scripts[`package:${name}`];
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`✅ package.json 스크립트 제거: dev:${name}, build:${name}, package:${name}`);

  // 스키마 + 버킷 삭제
  if (withDb) {
    console.log(`🗄️  Supabase 스키마 삭제 중...`);
    const schemaOk = dropSchema(name);
    if (schemaOk) {
      console.log(`✅ 스키마 삭제 완료: ${name}`);
    } else {
      console.log(`⚠️  스키마 삭제 실패 (Supabase가 실행 중인지 확인해주세요)`);
    }

    console.log(`📦 스토리지 버킷 삭제 중...`);
    const bucketOk = dropBucket(name);
    if (bucketOk) {
      console.log(`✅ 버킷 삭제 완료: ${name}`);
    } else {
      console.log(`⚠️  버킷 삭제 실패 (버킷이 없거나 Supabase가 실행 중인지 확인해주세요)`);
    }
  }

  console.log('\n🎉 삭제 완료!\n');
  rl.close();
}

main();
