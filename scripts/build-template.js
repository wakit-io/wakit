#!/usr/bin/env node
/**
 * 템플릿 빌드 (web-optional)
 *  1) webpack production 빌드 (wakit 난독화 + 앱 파일 복사)
 *  2) web/ Astro 레이어가 있으면 → astro build (web/ → dist/)
 *     없으면 → webpack이 이미 dist/로 출력했으므로 Astro 단계를 건너뜀
 *
 * 사용: node scripts/build-template.js <template>
 *       TEMPLATE=<template> node scripts/build-template.js
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const name = (process.argv[2] || process.env.TEMPLATE || '').trim();

if (!name) {
  console.error('❌ 템플릿 이름이 필요합니다. 예: node scripts/build-template.js app_basic');
  process.exit(1);
}

const templateDir = path.join(ROOT, 'templates', name);
if (!fs.existsSync(templateDir)) {
  console.error(`❌ 템플릿을 찾을 수 없습니다: templates/${name}`);
  process.exit(1);
}

console.log(`\n📦 [${name}] webpack 빌드 중...`);
execSync(`npx webpack --mode production --env template=${name}`, { cwd: ROOT, stdio: 'inherit' });

const webDir = path.join(templateDir, 'web');
if (fs.existsSync(webDir)) {
  console.log(`\n🌐 [${name}] web/ Astro 레이어 발견 → astro build (web/ → dist/)`);
  execSync('npm run build', { cwd: webDir, stdio: 'inherit' });
} else {
  console.log(`\nℹ️  [${name}] web/ 레이어 없음 → webpack이 templates/${name}/dist/ 로 직접 출력. Astro 단계 생략.`);
}

console.log(`\n✅ 빌드 완료: templates/${name}/dist/\n`);
