#!/usr/bin/env node
/**
 * 템플릿 스캐폴더 (구조 생성기)
 *
 * app_basic(골든 base)의 "셸"을 복사한 뒤, 페이지 목록(spec)에 맞춰
 *   - wakitConfig.json(tabs/routes/webNav) 생성
 *   - 각 페이지의 빈 뷰 스텁 + 화면 CSS 스텁 생성
 *   - index.html 재생성(홈 뷰 임베드)
 * 데모(movie) 콘텐츠는 비웁니다. <main> 안 콘텐츠는 이후 직접/에이전트가 채웁니다.
 *
 * 사용:
 *   node scripts/scaffold-template.js                 # 대화형 질문
 *   node scripts/scaffold-template.js spec.json       # 스펙 파일로 (질문 없음)
 *
 * 스펙(app.spec.json) 예시: scripts/app.spec.example.json
 */
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ROOT = path.resolve(__dirname, '..');
const TEMPLATES_DIR = path.join(ROOT, 'templates');
const BASE = path.join(TEMPLATES_DIR, 'app_basic');

// page id → 기본 아이콘 (bootstrap-icons)
const ICONS = {
  home: 'bi bi-house', search: 'bi bi-search', booking: 'bi bi-calendar-check',
  mypage: 'bi bi-person', profile: 'bi bi-person', detail: 'bi bi-card-text',
  cart: 'bi bi-cart', shop: 'bi bi-bag', store: 'bi bi-bag', list: 'bi bi-list',
  settings: 'bi bi-gear', favorite: 'bi bi-heart', wishlist: 'bi bi-heart',
  feed: 'bi bi-rss', chat: 'bi bi-chat', notify: 'bi bi-bell',
};
const DEFAULT_ICON = 'bi bi-circle';

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const iconFor = (id) => ICONS[id] || DEFAULT_ICON;

// ---- shell 복사 (rebrand) ----
function copyShell(src, dest, name) {
  const hyphenTo = name.replace(/_/g, '-');
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (['node_modules', '.astro', 'dist', 'web'].includes(entry.name)) continue;
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) { copyShell(s, d, name); continue; }
    let content = fs.readFileSync(s, 'utf8');
    content = content.replace(/app_basic/g, name).replace(/app-basic-/g, `${hyphenTo}-`);
    fs.writeFileSync(d, content);
  }
}

// ---- 데모(movie/demo) 콘텐츠 제거 ----
function stripDemoContent(dir) {
  const rm = (p) => { try { fs.unlinkSync(p); } catch (_) {} };
  const viewsDir = path.join(dir, 'views');
  const cssDir = path.join(dir, 'css');
  for (const f of fs.existsSync(viewsDir) ? fs.readdirSync(viewsDir) : []) {
    if (/^movie-/.test(f) || f === 'home.html' || f === 'detail.html') rm(path.join(viewsDir, f));
  }
  for (const f of fs.existsSync(cssDir) ? fs.readdirSync(cssDir) : []) {
    if (/^movie-/.test(f)) rm(path.join(cssDir, f));
  }
}

// ---- 공통 head/script 조각 ----
const sharedHead = (title) => `  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover">
  <title>${title}</title>
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="msapplication-tap-highlight" content="no">
  <link rel="manifest" href="../manifest.json">
  <meta name="theme-color" content="#ffffff">
  <script src="../../../wakit/js/wakit-bridge.js" data-spa-ignore></script>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css" rel="stylesheet" data-spa-ignore>
  <link rel="stylesheet" href="../../../wakit/css/wakit.css" data-spa-ignore>
  <link rel="stylesheet" href="../../../wakit/css/styleGuide.css" data-spa-ignore>
  <link rel="stylesheet" href="../../../wakit/css/component.css" data-spa-ignore>
  <link rel="stylesheet" href="css/foundation/index.css" data-spa-ignore>
  <link rel="stylesheet" href="css/style.css" data-spa-ignore>
  <script src="js/theme-init.js" data-spa-ignore></script>`;

const sharedScripts = `<script src="../../../wakit/js/wakit-popup.js" data-spa-ignore></script>
<script src="js/theme-toggle.js" data-spa-ignore></script>
<script src="js/header.js" data-spa-ignore></script>
<script src="js/scroll-to-top.js" data-spa-ignore></script>
<script data-spa-ignore>if (typeof Popup !== 'undefined') Popup.init();</script>`;

// ---- 풀 문서 뷰 스텁 ----
const fullDocStub = (page, brand) => `<!doctype html>
<html lang="ko">
<head>
${sharedHead(`${page.title} · ${brand}`)}
</head>
<body>

<div data-include="wakit-components/header.html" data-spa-ignore></div>

<!-- Screen-specific CSS: inside body, no data-spa-ignore -->
<link rel="stylesheet" href="css/${page.id}.css">

<main class="${page.id}-page container" role="main">
  <section class="${page.id}-hero">
    <h1>${page.title}</h1>
    <p>여기에 ${page.title} 콘텐츠를 구성하세요.</p>
  </section>
</main>

<div data-include="wakit-components/footer.html" data-spa-ignore></div>

</body>
${sharedScripts}
</html>
`;

// ---- 홈 뷰는 index.html에 임베드되는 조각(fragment) ----
const homeFragmentStub = (page) => `<!-- ${page.title} (home, index.html에 임베드되는 조각) -->
<link rel="stylesheet" href="css/${page.id}.css">

<main class="${page.id}-page container" role="main">
  <section class="${page.id}-hero">
    <h1>${page.title}</h1>
    <p>여기에 ${page.title} 콘텐츠를 구성하세요.</p>
  </section>
</main>
`;

// ---- index.html (홈 뷰 임베드) ----
const indexHtml = (brand, homeId) => `<!doctype html>
<html lang="ko">
<head>
${sharedHead(brand).replace('../manifest.json', './manifest.json')}
</head>
<body>

<div data-include="wakit-components/header.html" data-spa-ignore></div>

<div data-include="views/${homeId}.html"></div>

<div data-include="wakit-components/footer.html" data-spa-ignore></div>

</body>
${sharedScripts}
</html>
`;

// ---- 화면 CSS 스텁 ----
const cssStub = (page) => `/* ${page.title} (${page.id}) — foundation 토큰 사용 */
.${page.id}-page { padding: 24px 0 48px; min-height: 60vh; }
.${page.id}-hero h1 { margin: 0 0 8px; font-size: 22px; font-weight: 700; color: var(--color-text-primary); }
.${page.id}-hero p { margin: 0; color: var(--color-text-secondary); }
`;

// ---- wakitConfig 생성 ----
function buildConfig(spec, pagesById, homeId) {
  return {
    splashDelay: 100,
    splashForce: false,
    tabbar: { autoHide: false, hideThreshold: 14, displayMode: 'web' },
    pullToRefresh: { threshold: 90, startSlop: 18, damping: 0.35, maxPull: 200 },
    appbarView: true,
    theme: { primaryColor: spec.primaryColor, font: 'Pretendard, system-ui', isMobile: true },
    defaultTab: spec.tabs[0] || homeId,
    tabs: spec.tabs.map((id) => {
      const p = pagesById[id];
      return { id, label: p.title, icon: p.icon || iconFor(id), page: id };
    }),
    routes: spec.pages.map((p) => ({ path: p.id, file: `../views/${p.id}.html`, title: p.title })),
    webNav: {
      brand: { label: spec.brandLabel, logo: '✦', href: 'index.html' },
      items: spec.webNav.map((id) => ({
        label: pagesById[id].title,
        href: id === homeId ? 'index.html' : `views/${id}.html`,
      })),
    },
  };
}

// ---- 생성 실행 ----
function generate(spec) {
  const dir = path.join(TEMPLATES_DIR, spec.name);
  if (fs.existsSync(dir)) { console.log(`❌ 이미 존재: templates/${spec.name}`); return; }

  console.log(`\n📁 셸 복사 (app_basic → ${spec.name})...`);
  copyShell(BASE, dir, spec.name);
  stripDemoContent(dir);

  const pagesById = Object.fromEntries(spec.pages.map((p) => [p.id, p]));
  const homeId = spec.pages[0].id;

  // 뷰 + CSS 스텁
  console.log('📝 뷰/CSS 스텁 생성...');
  for (const p of spec.pages) {
    const isHome = p.id === homeId;
    fs.writeFileSync(path.join(dir, 'views', `${p.id}.html`), isHome ? homeFragmentStub(p) : fullDocStub(p, spec.brandLabel));
    fs.writeFileSync(path.join(dir, 'css', `${p.id}.css`), cssStub(p));
  }

  // index.html (홈 임베드)
  fs.writeFileSync(path.join(dir, 'index.html'), indexHtml(spec.brandLabel, homeId));

  // wakitConfig
  fs.writeFileSync(path.join(dir, 'wakitConfig.json'), JSON.stringify(buildConfig(spec, pagesById, homeId), null, 2) + '\n');

  // package.json 스크립트
  const pkgPath = path.join(ROOT, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  pkg.scripts[`dev:${spec.name}`] = `webpack serve --mode development --env template=${spec.name}`;
  pkg.scripts[`build:${spec.name}`] = `node scripts/build-template.js ${spec.name}`;
  pkg.scripts[`package:${spec.name}`] = `TEMPLATE=${spec.name} node scripts/package-template.js`;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

  console.log(`\n✅ 스캐폴드 완료: templates/${spec.name}/`);
  console.log(`   페이지: ${spec.pages.map((p) => p.id).join(', ')}`);
  console.log(`   탭바: ${spec.tabs.join(', ')}  |  웹메뉴: ${spec.webNav.join(', ')}`);
  console.log(`\n▶ 개발 서버:  npm run dev:${spec.name}`);
  console.log(`   (빈 껍데기 앱이 뜹니다 — <main> 콘텐츠만 채우면 됨)\n`);
}

// ---- 스펙 정규화 (문자열 페이지 → 객체) ----
function normalizeSpec(raw) {
  const pages = (raw.pages || []).map((p) =>
    typeof p === 'string' ? { id: p, title: cap(p), icon: iconFor(p) } : { id: p.id, title: p.title || cap(p.id), icon: p.icon || iconFor(p.id) }
  );
  if (!pages.length) throw new Error('pages가 비어 있습니다.');
  const ids = pages.map((p) => p.id);
  return {
    name: raw.name,
    primaryColor: raw.primaryColor || '#3b82f6',
    brandLabel: raw.brandLabel || cap(raw.name.replace(/_/g, ' ')),
    pages,
    tabs: (raw.tabs && raw.tabs.length ? raw.tabs : ids.slice(0, 4)).filter((id) => ids.includes(id)),
    webNav: (raw.webNav && raw.webNav.length ? raw.webNav : ids).filter((id) => ids.includes(id)),
  };
}

// ---- 대화형 ----
async function interactive() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => new Promise((res) => rl.question(q, res));
  console.log('\n🏗️  템플릿 스캐폴드 (app_basic 기반)\n');
  const name = (await ask('템플릿 이름 (예: hotel_app): ')).trim();
  if (!name) { console.log('❌ 이름이 필요합니다.'); rl.close(); return null; }
  const primaryColor = (await ask('브랜드 색상 (기본 #3b82f6): ')).trim() || '#3b82f6';
  const brandLabel = (await ask(`브랜드 표시명 (기본 ${cap(name.replace(/_/g, ' '))}): `)).trim() || cap(name.replace(/_/g, ' '));
  const pagesIn = (await ask('페이지 목록 (쉼표, 예: home, search, detail, booking, mypage): ')).trim();
  const pages = pagesIn.split(',').map((s) => s.trim()).filter(Boolean);
  if (!pages.length) { console.log('❌ 페이지가 필요합니다.'); rl.close(); return null; }
  const tabsIn = (await ask(`모바일 하단 탭 (쉼표, 기본=앞 4개 [${pages.slice(0, 4).join(', ')}]): `)).trim();
  const webNavIn = (await ask(`웹 헤더 메뉴 (쉼표, 기본=전체 [${pages.join(', ')}]): `)).trim();
  rl.close();
  return normalizeSpec({
    name, primaryColor, brandLabel, pages,
    tabs: tabsIn ? tabsIn.split(',').map((s) => s.trim()).filter(Boolean) : null,
    webNav: webNavIn ? webNavIn.split(',').map((s) => s.trim()).filter(Boolean) : null,
  });
}

async function main() {
  const specArg = process.argv[2];
  let spec;
  if (specArg && specArg.endsWith('.json')) {
    const raw = JSON.parse(fs.readFileSync(path.resolve(specArg), 'utf8'));
    if (!raw.name) throw new Error('스펙에 name이 필요합니다.');
    spec = normalizeSpec(raw);
    console.log(`\n📄 스펙 사용: ${specArg}`);
  } else {
    spec = await interactive();
  }
  if (spec) generate(spec);
}

main();
