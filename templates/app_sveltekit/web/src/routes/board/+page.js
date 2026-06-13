// 빌드(프리렌더) 시점에 데이터 로드 → 정적 HTML에 그대로 박힘.
// 실제 템플릿에서는 여기서 Supabase(서버/anon)나 fetch('/api/...')로 교체.
export function load() {
  const posts = [
    { id: 1, title: 'WAKIT 1.0 released', meta: 'Notice · 2 min ago' },
    { id: 2, title: 'How the dual router works', meta: 'Guide · 1 hour ago' },
    { id: 3, title: 'Shipping web + app from one template', meta: 'Story · Yesterday' }
  ];
  return { posts };
}
