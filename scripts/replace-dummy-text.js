const fs = require('fs');
const path = require('path');

// 더미 텍스트 풀
const dummyPools = {
  blog: {
    titles: [
      "일상의 작은 변화로 시작하는 새로운 습관",
      "효율적인 시간 관리를 위한 5가지 팁",
      "창의적인 아이디어를 끌어내는 방법",
      "디지털 시대의 워크라이프 밸런스",
      "미니멀 라이프로 찾은 행복",
      "주말 활용법: 재충전을 위한 시간",
      "생산성을 높이는 모닝 루틴",
      "온라인 쇼핑의 현명한 소비 전략",
      "홈 오피스 꾸미기 가이드",
      "봄맞이 대청소 체크리스트",
      "재택근무의 장점과 단점",
      "취미 생활로 찾은 여유로움",
      "건강한 식습관 만들기",
      "욜로와 휘토의 균형점 찾기",
      "내가 사랑하는 일에 집중하기"
    ],
    descriptions: [
      "바쁜 일상 속에서 잠깐의 여유를 찾는 방법에 대해 이야기합니다.",
      "작은 변화가 모여 큰 성과를 만드는 과정을 공유합니다.",
      "일상에서 실천할 수 있는 간단한 팁들을 소개합니다.",
      "효율적인 업무 처리를 위한 실용적인 조언들입니다.",
      "삶의 질을 높이는 다양한 아이디어를 만나보세요.",
      "당신의 일상에 활력을 불어넣을 인사이트를 전달합니다.",
      "새로운 관점으로 바라보는 일상의 이야기들입니다.",
      "실천 가능한 방법들로 시작하는 작은 변화들입니다.",
      "더 나은 라이프스타일을 위한 고민과 해결책을 제시합니다.",
      "오늘부터 시작할 수 있는 새로운 시도들을 소개합니다."
    ],
    categories: ["라이프스타일", "디자인", "기술", "여행", "음식", "취미"]
  },
  
  event: {
    names: [
      "디자인 워크숍 2024",
      "테크 세미나: 미래를 향한 도전",
      "창작자 밋업 네트워킹",
      "UX/UI 트렌드 컨퍼런스",
      "디지털 마케팅 포럼",
      "스타트업 피치 데이",
      "개발자 밋업: 코드와 커피",
      "브랜드 스토리텔링 워크숍",
      "데이터 분석 실전 세미나",
      "AI 활용 크리에이티브 세션",
      "이커머스 성공 전략 세미나",
      "프리랜서 성장 워크숍",
      "신제품 런칭 쇼케이스",
      "비즈니스 네트워킹 이벤트",
      "콘텐츠 크리에이션 워크숍"
    ],
    descriptions: [
      "업계 전문가들과 함께하는 깊이 있는 토론의 시간",
      "실무에 바로 적용할 수 있는 인사이트를 공유합니다",
      "네트워킹과 학습이 함께하는 특별한 시간",
      "최신 트렌드를 한눈에 파악할 수 있는 기회",
      "참가자들과의 교류를 통해 새로운 아이디어를 얻어가세요",
      "실전 사례 중심의 알찬 내용이 준비되어 있습니다",
      "함께 성장하고 배우는 소통의 장을 만들어갑니다",
      "전문가의 노하우를 직접 전달받는 시간",
      "참여형 세션으로 더욱 깊이 있는 이해를 돕습니다",
      "업계 동향과 미래 전망에 대한 통찰을 제시합니다"
    ]
  },
  
  portfolio: {
    projects: [
      "브랜드 아이덴티티 리디자인",
      "모바일 앱 UX 개선 프로젝트",
      "기업 웹사이트 리뉴얼",
      "패키지 디자인 시스템 구축",
      "모션 그래픽 캠페인",
      "디지털 일러스트레이션 시리즈",
      "편집 디자인: 매거진 리디자인",
      "프로덕트 디자인: 스마트 기기",
      "브랜드 스토리텔링 프로젝트",
      "인포그래픽 디자인",
      "SNS 콘텐츠 디자인",
      "전시 공간 디자인",
      "로고 디자인 포트폴리오",
      "타이포그래피 프로젝트",
      "사진 촬영 및 리터칭"
    ],
    categories: ["브랜딩", "UX/UI", "그래픽 디자인", "모션", "편집", "일러스트"],
    descriptions: [
      "클리어한 컨셉으로 전달하는 브랜드의 가치",
      "사용자 중심의 직관적인 디자인 솔루션",
      "시각적 임팩트와 기능성의 균형을 맞춘 작업",
      "디테일에 집중한 정교한 디자인 프로세스",
      "브랜드 아이덴티티를 강화하는 토탈 솔루션",
      "스토리텔링을 담은 감성적인 디자인",
      "혁신적인 아이디어와 실용성의 조화",
      "타겟 사용자를 고려한 맞춤형 디자인",
      "트렌드와 클래식의 균형점을 찾은 작업",
      "브랜드의 목소리를 시각화한 프로젝트"
    ]
  },
  
  shop: {
    products: [
      "오버사이즈 울 코트",
      "미니멀 레더 백",
      "캐시미어 니트",
      "클린 컷 데님",
      "클로그 샌들",
      " 린넨 셔츠",
      "퍼프 슬리브 블라우스",
      "와이드 슬랙스",
      "트렌치 코트",
      "니트 베스트",
      "플리스 자켓",
      "크로스 백",
      "스니커즈",
      "블레이저",
      "원피스"
    ],
    reviews: [
      "정말 만족스러운 구매였어요. 퀄리티가 좋습니다.",
      "배송도 빠르고 상품도 사진과 똑같아요.",
      "가격 대비 품질이 훌륭합니다. 추천해요.",
      "사이즈가 딱 맞아서 기분이 좋아요.",
      "재구매 의향 100%입니다. 다음에도 살게요.",
      "색상이 화면과 비슷해서 만족합니다.",
      "디자인이 깔끔하고 고급스러워요.",
      "일상에서 자주 입게 될 것 같아요.",
      "선물했는데 받은 분이 너무 좋아하셨어요.",
      "소재가 부드럽고 착용감이 좋습니다."
    ]
  }
};

// 랜덤 선택 함수 (파일명 기반 시드)
function getRandomItem(array, seed) {
  const index = seed % array.length;
  return array[index];
}

// 파일명에서 시드값 생성
function getSeedFromFilename(filename) {
  let hash = 0;
  for (let i = 0; i < filename.length; i++) {
    const char = filename.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// 페이지 유형 결정
function getPageType(filename) {
  if (filename.startsWith('blog-')) return 'blog';
  if (filename.startsWith('event-')) return 'event';
  if (filename.startsWith('portfolio-')) return 'portfolio';
  if (filename.startsWith('shop-')) return 'shop';
  return 'general';
}

// 텍스트 교체 함수
function replaceText(content, pageType, filename) {
  const seed = getSeedFromFilename(filename);
  const pool = dummyPools[pageType] || dummyPools.blog;
  
  let modified = content;
  let changes = [];
  
  // 패턴 1: Sample Project (포트폴리오)
  if (pageType === 'portfolio') {
    const project = getRandomItem(pool.projects, seed);
    const category = getRandomItem(pool.categories, seed + 1);
    
    modified = modified.replace(/Sample Project/g, project);
    modified = modified.replace(/Sample Category/g, category);
    changes.push(`Sample Project → ${project}`);
    changes.push(`Sample Category → ${category}`);
  }
  
  // 패턴 2: 제품 이름/상품명 (쇼핑몰)
  if (pageType === 'shop') {
    // 상품명 교체
    let count = 0;
    modified = modified.replace(/상품 이름|제품 이름/g, () => {
      const product = getRandomItem(pool.products, seed + count);
      count++;
      return product;
    });
    if (count > 0) changes.push(`상품/제품 이름 → ${count}개 교체`);
    
    // 리뷰 교체 (간단한 패턴만)
    modified = modified.replace(/상품 후기가 좋아서 구매했는데 정말 실망스럽지 않아요/g, 
      getRandomItem(pool.reviews, seed));
  }
  
  // 패턴 3: 섹션 설명
  modified = modified.replace(/섹션 설명 영역입니다\.?/g, 
    getRandomItem(dummyPools.blog.descriptions, seed));
  changes.push('섹션 설명 영역 교체');
  
  // 패턴 4: 현재 페이지 타이틀
  if (pageType === 'blog') {
    modified = modified.replace(/현재 페이지 타이틀/g, 
      getRandomItem(pool.titles, seed));
    changes.push('현재 페이지 타이틀 교체');
  }
  
  // 패턴 5: Category (영문)
  if (pageType === 'event' || pageType === 'portfolio') {
    modified = modified.replace(/Category/g, 
      getRandomItem(pool.categories || ['General'], seed));
    changes.push('Category 교체');
  }
  
  // 패턴 6: 텍스트 placeholder
  modified = modified.replace(/>텍스트</g, '>콘텐츠<');
  changes.push('텍스트 placeholder 교체');
  
  return { content: modified, changes };
}

// 메인 실행 함수
async function main() {
  const viewsDir = path.join(__dirname, '..', 'templates', 'blog', 'views');
  const backupDir = path.join(__dirname, '..', 'templates', 'blog', 'views-backup');
  
  // 백업 폴더 생성
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  // HTML 파일 목록 가져오기
  const files = fs.readdirSync(viewsDir)
    .filter(f => f.endsWith('.html'))
    .filter(f => f.startsWith('blog-') || f.startsWith('event-') || 
                f.startsWith('portfolio-') || f.startsWith('shop-'));
  
  console.log(`총 ${files.length}개 파일 처리 시작...\n`);
  
  const results = {
    blog: [],
    event: [],
    portfolio: [],
    shop: []
  };
  
  for (const file of files) {
    const filePath = path.join(viewsDir, file);
    const backupPath = path.join(backupDir, file);
    
    // 원본 백업
    const content = fs.readFileSync(filePath, 'utf-8');
    fs.writeFileSync(backupPath, content);
    
    // 페이지 유형 결정
    const pageType = getPageType(file);
    
    // 텍스트 교체
    const result = replaceText(content, pageType, file);
    
    // 수정된 내용 저장
    fs.writeFileSync(filePath, result.content);
    
    results[pageType].push({
      file,
      changes: result.changes
    });
    
    console.log(`✓ ${file} 처리 완료 (${result.changes.length}개 변경)`);
  }
  
  // 결과 출력
  console.log('\n=== 처리 결과 ===');
  for (const [type, files] of Object.entries(results)) {
    if (files.length > 0) {
      console.log(`\n${type.toUpperCase()}: ${files.length}개 파일`);
    }
  }
  
  console.log('\n백업 위치:', backupDir);
  console.log('원본 복구 필요시: cp -r views-backup/* views/');
}

main().catch(console.error);
