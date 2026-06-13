#!/usr/bin/env node
/**
 * wakit 템플릿 러너 — per-template package.json 스크립트 없이 어떤 템플릿이든 실행.
 *   → 새 템플릿을 만들어도 package.json 을 건드릴 필요가 없다(관리/삭제 불필요).
 *
 * 사용:
 *   node scripts/wakit.js web <template>      # 웹 레이어 dev 서버 (web/ 있을 때, /app·/wakit 도 서빙)
 *   node scripts/wakit.js dev <template>      # webpack 앱 dev 서버
 *   node scripts/wakit.js build <template>    # 빌드 → templates/<t>/dist
 *   node scripts/wakit.js package <template>  # 패키징 zip
 *   node scripts/wakit.js list                # 템플릿 목록
 *
 * npm 별칭: npm run wakit -- <cmd> <template>   (예: npm run wakit -- web app_todo)
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const [cmd, template] = process.argv.slice(2);

const HELP = `
wakit 템플릿 러너
  node scripts/wakit.js web <template>      웹 레이어 dev 서버
  node scripts/wakit.js dev <template>      webpack 앱 dev 서버
  node scripts/wakit.js build <template>    빌드
  node scripts/wakit.js package <template>  패키징
  node scripts/wakit.js list                템플릿 목록
`;

function templates() {
  const dir = path.join(ROOT, 'templates');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
}
function assertTemplate(t) {
  if (!t) { console.error('❌ 템플릿 이름이 필요합니다.\n' + HELP); process.exit(1); }
  if (!fs.existsSync(path.join(ROOT, 'templates', t))) {
    console.error(`❌ 템플릿 없음: ${t}\n   사용 가능: ${templates().join(', ')}`); process.exit(1);
  }
}
function run(c, opts) { execSync(c, { cwd: ROOT, stdio: 'inherit', ...opts }); }

switch (cmd) {
  case 'web': {
    assertTemplate(template);
    const webDir = path.join(ROOT, 'templates', template, 'web');
    if (!fs.existsSync(webDir)) { console.error(`❌ ${template} 에 web/ 레이어가 없습니다. 'dev' 를 사용하세요.`); process.exit(1); }
    run('npm run dev', { cwd: webDir });
    break;
  }
  case 'dev':
    assertTemplate(template);
    run(`npx webpack serve --mode development --env template=${template}`);
    break;
  case 'build':
    assertTemplate(template);
    run(`node scripts/build-template.js ${template}`);
    break;
  case 'package':
    assertTemplate(template);
    run('node scripts/package-template.js', { env: { ...process.env, TEMPLATE: template } });
    break;
  case 'list':
    console.log(templates().join('\n'));
    break;
  default:
    console.log(HELP);
}
