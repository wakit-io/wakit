import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/**
 * WAKIT web layer (SvelteKit)
 *  - adapter-static + prerender → 순수 정적 HTML 출력 (배포 시 프레임워크 런타임 0)
 *  - files.assets = 'public' → webpack이 채우는 web/public(app/ · wakit/)을 static 디렉터리로 그대로 사용
 *  - 빌드 출력은 ../dist (build-template.js / 기존 Astro 템플릿과 동일한 위치)
 */
/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      pages: '../dist',
      assets: '../dist',
      fallback: undefined,
      precompress: false,
      strict: true
    }),
    files: {
      // webpack output (web/public/app, web/public/wakit) = SvelteKit static dir
      assets: 'public'
    },
    prerender: {
      // placeholder "#" anchors in template pages shouldn't fail the build
      handleMissingId: 'warn'
    }
  }
};

export default config;
