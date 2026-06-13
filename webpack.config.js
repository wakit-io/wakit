const path = require('path');
const fs = require('fs');
const net = require('net');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const Terser = require('terser');
const JavaScriptObfuscator = require('javascript-obfuscator');

// Minimal plugin to watch external directories so webpack rebuilds on change
class WatchExternalFilesPlugin {
  constructor(paths) { this.paths = paths || []; }
  apply(compiler) {
    compiler.hooks.afterCompile.tap('WatchExternalFilesPlugin', (compilation) => {
      this.paths.forEach((p) => {
        try { compilation.contextDependencies.add(p); } catch (_) {}
      });
    });
  }
}

// Find a free TCP port, preferring `start` and incrementing if it is taken.
function findFreePort(start, maxTries = 50) {
  return new Promise((resolve, reject) => {
    const tryPort = (port, triesLeft) => {
      const srv = net.createServer();
      srv.once('error', (err) => {
        srv.close(() => {});
        if (err.code === 'EADDRINUSE' && triesLeft > 0) tryPort(port + 1, triesLeft - 1);
        else reject(err);
      });
      srv.once('listening', () => srv.close(() => resolve(port)));
      srv.listen(port, '0.0.0.0');
    };
    tryPort(start, maxTries);
  });
}

module.exports = async (env = {}, argv = {}) => {
  const template = (env.template || process.env.TEMPLATE || 'blog').toString();
  const templateSrc = path.resolve(__dirname, `templates/${template}`);
  const isServe = process.env.WEBPACK_SERVE === 'true' || process.env.WEBPACK_SERVE === '1' || argv.devServer === true;

  // Web-optional build output:
  //  - If the template has an Astro web/ layer → output to web/public/ (Astro then builds → dist/)
  //  - If not → output straight to dist/ (deployable without Astro). Same app/ + wakit/ sub-structure either way.
  const hasWebLayer = fs.existsSync(path.join(templateSrc, 'web'));
  const outRoot = hasWebLayer
    ? path.resolve(__dirname, `templates/${template}/web/public`)
    : path.resolve(__dirname, `templates/${template}/dist`);

  // Prefer PORT env, then 5173; auto-increment to the next free port if busy
  // so multiple `npm run dev:<template>` servers can run at the same time.
  const basePort = Number(process.env.PORT) || 5173;
  const devPort = isServe ? await findFreePort(basePort) : basePort;

  return {
    mode: process.env.NODE_ENV || 'production',
    entry: path.resolve(__dirname, 'build/noop.js'),
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'noop.js',
      clean: true,
    },
    watchOptions: {
      aggregateTimeout: 100,
      ignored: /node_modules/,
    },
    plugins: (
      isServe
        ? [
            // Ensure changes in wakit/ and current template trigger reload
            new WatchExternalFilesPlugin([
              path.resolve(__dirname, 'wakit'),
              templateSrc,
            ]),
          ]
        : [
            new CopyWebpackPlugin({
              patterns: [
                // Minify + obfuscate wakit JS and place under the selected template's web/public/wakit/
                {
                  from: 'wakit/js/*.js',
                  to: path.join(outRoot, 'wakit/js/[name][ext]'),
                  transform: async (content, absoluteFrom) => {
                    const filename = path.basename(absoluteFrom);
                    const isEsModule = filename === 'wakit.js';

                    // 1. Terser: dead code elimination + variable mangling
                    const terserResult = await Terser.minify(content.toString(), {
                      module: isEsModule,
                      compress: true,
                      mangle: true,
                    });
                    const minified = terserResult.code || content.toString();

                    // 2. javascript-obfuscator: string encryption + control flow obfuscation
                    const obfuscated = JavaScriptObfuscator.obfuscate(minified, {
                      compact: true,
                      controlFlowFlattening: true,
                      controlFlowFlatteningThreshold: 0.3,
                      deadCodeInjection: false,
                      debugProtection: false,
                      identifierNamesGenerator: 'hexadecimal',
                      numbersToExpressions: true,
                      renameGlobals: false,
                      rotateStringArray: true,
                      selfDefending: false,
                      shuffleStringArray: true,
                      splitStrings: true,
                      splitStringsChunkLength: 10,
                      stringArray: true,
                      stringArrayCallsTransform: true,
                      stringArrayEncoding: ['base64'],
                      stringArrayIndexShift: true,
                      stringArrayRotate: true,
                      stringArrayShuffle: true,
                      stringArrayWrappersCount: 2,
                      stringArrayWrappersChainedCalls: true,
                      stringArrayWrappersParametersMaxCount: 4,
                      stringArrayWrappersType: 'function',
                      stringArrayThreshold: 0.75,
                      transformObjectKeys: true,
                      unicodeEscapeSequence: false,
                      sourceType: isEsModule ? 'module' : 'script',
                    });
                    return obfuscated.getObfuscatedCode();
                  },
                },
                // Copy other wakit assets under the selected template's web/public/wakit/
                {
                  from: 'wakit',
                  to: path.join(outRoot, 'wakit'),
                  globOptions: { ignore: ['**/js/*.js'] },
                  noErrorOnMissing: true,
                },
                // Service worker at the dist ROOT → scope "/" (controls /app, /wakit, web pages)
                {
                  from: 'wakit/service-worker.js',
                  to: path.join(outRoot, 'service-worker.js'),
                  noErrorOnMissing: true,
                },
                // Copy template files into web/public/app/ and rewrite wakit paths
                {
                  from: templateSrc,
                  to: path.join(outRoot, 'app'),
                  // Exclude the web/ and dist/ subfolders from being copied into app/
                  globOptions: { ignore: [`${templateSrc}/web/**`, `${templateSrc}/dist/**`] },
                  transform: (content, absoluteFrom) => {
                    if (/\.html?$/i.test(absoluteFrom)) {
                      const html = content.toString();
                      // compute relative depth from template root to file dir
                      const relFromTemplate = path.relative(templateSrc, path.dirname(absoluteFrom));
                      const depth = relFromTemplate.split(path.sep).filter(Boolean).length;
                      // +1 for the extra app/ subdirectory prefix
                      const relPrefix = `${'../'.repeat(depth + 1)}wakit/`;
                      // replace all variants of wakit prefix regardless of leading quotes
                      const pattern = /(?:^|[\s=:\(\[\{\"\'`])(\/|\.\/|(?:\.\.\/)+)?wakit\//g;
                      return html.replace(pattern, (m) => m.replace(/(\/|\.\/|(?:\.\.\/)+)?wakit\//, relPrefix));
                    }
                    return content;
                  },
                },
              ],
            }),
            new WatchExternalFilesPlugin([
              path.resolve(__dirname, 'wakit'),
              templateSrc,
            ]),
          ]
    ),
    devServer: {
      static: [
        // Serve wakit source directly at /wakit during dev
        { directory: path.resolve(__dirname, 'wakit'), publicPath: '/wakit', watch: true },
        // Serve template source at /app during dev
        { directory: templateSrc, publicPath: '/', watch: true },
        // Also serve dist as fallback
        { directory: path.resolve(__dirname, 'dist'), watch: true },
      ],
      port: devPort,
      open: ['/index.html'],
      compress: true,
      host: '0.0.0.0',
      allowedHosts: 'all',
      devMiddleware: { writeToDisk: true },
      liveReload: true,
      hot: false,
      watchFiles: {
        paths: [
          path.resolve(__dirname, 'wakit/**/*'),
          path.resolve(__dirname, 'templates/**/*'),
          path.resolve(__dirname, 'webpack.config.js'),
        ],
        options: { usePolling: true, interval: 300 },
      },
      historyApiFallback: {
        rewrites: [
          // /app/views/foo -> /app/views/foo.html
          {
            from: /^\/app\/views\/([^/?#]+)$/,
            to: (ctx) => `/app/views/${ctx.match[1]}.html`,
          },
          // /app -> /app/app.html
          {
            from: /^\/app$/,
            to: '/app/app.html',
          },
        ],
      },
      headers: {
        // allow CORS if needed and ensure correct content types
        'Access-Control-Allow-Origin': '*',
      },
    },
  };
};


