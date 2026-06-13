import { error } from '@sveltejs/kit';

const POSTS = {
  1: { title: 'WAKIT 1.0 released', body: 'The first stable release of the hybrid web + app template engine.' },
  2: { title: 'How the dual router works', body: 'SvelteKit owns web routing; wakit.js owns the app shell. They never collide.' },
  3: { title: 'Shipping web + app from one template', body: 'Build once, deliver a static site and a native-feeling app together.' }
};

// 프리렌더할 동적 경로 목록을 명시 (crawling 없이도 안전).
export function entries() {
  return Object.keys(POSTS).map((id) => ({ id }));
}

export function load({ params }) {
  const post = POSTS[params.id];
  if (!post) throw error(404, 'Not found');
  return { id: params.id, ...post };
}
