import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const templateRoot = path.resolve(__dirname, '..'); // templates/app_sveltekit/
const wakitRoot = path.resolve(__dirname, '../../../wakit'); // wakit/

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

// dev 전용: /app(wakit 앱) · /wakit(엔진 소스) 정적 서빙 — Astro 미들웨어와 동일 동작
function serveDir(baseDir, exclude) {
  return (req, res, next) => {
    const url = (req.url || '/').split('?')[0];
    const filePath = path.join(baseDir, decodeURIComponent(url));
    if (exclude && filePath.startsWith(exclude)) return next();
    try {
      const stat = fs.statSync(filePath);
      if (stat.isFile()) {
        res.setHeader('Content-Type', MIME[path.extname(filePath)] || 'application/octet-stream');
        fs.createReadStream(filePath).pipe(res);
      } else if (stat.isDirectory()) {
        const idx = path.join(filePath, 'app.html');
        const idx2 = path.join(filePath, 'index.html');
        const target = fs.existsSync(idx) ? idx : fs.existsSync(idx2) ? idx2 : null;
        if (target) {
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          fs.createReadStream(target).pipe(res);
        } else next();
      } else next();
    } catch {
      next();
    }
  };
}

const devServeAppWakit = {
  name: 'dev-serve-app-wakit',
  configureServer(server) {
    // /app/* → 템플릿 루트 (web/ 제외해 순환 방지)
    server.middlewares.use('/app', serveDir(templateRoot, path.join(templateRoot, 'web')));
    // /wakit/* → wakit 엔진 소스
    server.middlewares.use('/wakit', serveDir(wakitRoot));
  }
};

export default defineConfig({
  // 전용 포트: webpack dev 서버(템플릿 기본 5173~)와 절대 겹치지 않게 분리.
  // 둘 다 /app·/wakit 를 서빙하므로 포트가 섞이면 다른 템플릿이 떠 혼란이 생김.
  server: { port: 5180, strictPort: false },
  plugins: [devServeAppWakit, sveltekit()]
});
