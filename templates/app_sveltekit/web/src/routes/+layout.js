// WAKIT web layer: 모든 라우트 프리렌더 → 정적 HTML.
// csr=false → 클라이언트 자바스크립트 번들 미포함(순수 HTML/CSS). wakit 앱(/app)은 별개로 동작.
export const prerender = true;
export const csr = false;
export const trailingSlash = 'always';
