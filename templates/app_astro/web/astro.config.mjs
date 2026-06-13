// @ts-check
import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const templateRoot = path.resolve(__dirname, '..'); // templates/app_astro/
const wakitRoot   = path.resolve(__dirname, '../../../wakit'); // wakit/

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
};

function serveDir(baseDir, exclude) {
  return (req, res, next) => {
    const url = (req.url || '/').split('?')[0];
    const filePath = path.join(baseDir, url);
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
    } catch { next(); }
  };
}

export default defineConfig({
  compressHTML: false,
  outDir: '../dist',
  // /board/ style URLs so the wakit app can fetch the same path in dev and build
  trailingSlash: 'always',
  build: { format: 'directory' },
  vite: {
    plugins: [{
      name: 'dev-serve-app-wakit',
      configureServer(server) {
        // /app/* → template root (exclude web/ to prevent circular)
        server.middlewares.use('/app', serveDir(templateRoot, path.join(templateRoot, 'web')));
        // /wakit/* → wakit source
        server.middlewares.use('/wakit', serveDir(wakitRoot));
      },
    }],
  },
});
