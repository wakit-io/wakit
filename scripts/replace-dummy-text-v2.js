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
      "미니멀 라이프로 찾은 행복"
    ],
    descriptions: [
      "바쁜 일상 속에서 잠깐의 여유를 찾는 방법에 대해 이야기합니다.",
      "작은 변화가 모여 큰 성과를 만드는 과정을 공유합니다.",
      "일상에서 실천할 수 있는 간단한 팁들을 소개합니다."
    ],
    categories: ["라이프스타일", "디자인", "기술", "여행", "음식", "취미"]
  },
  
  event: {
    names: [
      "디자인 워크숍 2024",
      "테크 세미나: 미래를 향한 도전",
      "창작자 밋업 네트워킹",
      "UX/UI 트렌드 컨퍼런스"
    ],
    descriptions: [
      "업계 전문가들과 함께하는 깊이 있는 토론의 시간",
      "실무에 바로 적용할 수 있는 인사이트를 공유합니다",
      "네트워킹과 학습이 함께하는 특별한 시간"
    ]
  },
  
  portfolio: {
    projects: [
      "브랜드 아이덴티티 리디자인",
      "모바일 앱 UX 개선 프로젝트",
      "기업 웹사이트 리뉴얼",
      "패키지 디자인 시스템 구축"
    ],
    categories: ["브랜딩", "UX/UI", "그래픽 디자인", "모션", "편집", "일러스트"],
    descriptions: [
      "클리어한 컨셉으로 전달하는 브랜드의 가치",
      "사용자 중심의 직관적인 디자인 솔루션",
      "시각적 임팩트와 기능성의 균형을 맞춘 작업"
    ]
  },
  
  shop: {
    products: [
      "오버사이즈 울 코트",
      "미니멀 레더 백",
      "캐시미어 니트",
      "클린 컷 데님"
    ],
    reviews: [
      "정말 만족스러운 구매였어요. 퀄리티가 좋습니다.",
      "배송도 빠르고 상품도 사진과 똑같아요.",
      "가격 대비 품질이 훌륭합니다. 추천해요."
    ],
    promo: [
      "오늘만 특별한 혜택을 놓치지 마세요",
      "회원만을 위한 특별한 이벤트 진행중",
      "한정 수량 특가 상품을 만나보세요"
    ]
  },
  
  company: {
    descriptions: [
      "혁신적인 아이디어로 고객의 니즈를 충족시키는 전문가 그룹입니다.",
      "디자인과 기술의 융합을 통해 새로운 가치를 창출합니다.",
      "고객 중심의 서비스로 지속적인 성장을 이루어가고 있습니다."
    ],
    values: [
      "혁신과 도전",
      "고객 중심",
      "지속 가능한 성장"
    ]
  }
};

// 랜덤 선택 함수
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
  if (filename.startsWith('company-')) return 'company';
  if (filename.startsWith('service-')) return 'company';
  return 'general';
}

// 텍스트 교체 함수
function replaceText(content, pageType, filename) {
  const seed = getSeedFromFilename(filename);
  const pool = dummyPools[pageType] || dummyPools.blog;
  
  let modified = content;
  let changes = [];
  
  // 1. Sample Project (포트폴리오)
  if (pageType === 'portfolio' || modified.includes('Sample Project')) {
    let count = 0;
    modified = modified.replace(/Sample Project/g, () => {
      const project = getRandomItem(dummyPools.portfolio.projects, seed + count);
      count++;
      return project;
    });
    if (count > 0) changes.push(`Sample Project → ${count}개 교체`);
  }
  
  // 2. Sample Category
  if (modified.includes('Sample Category')) {
    let count = 0;
    modified = modified.replace(/Sample Category/g, () => {
      let category;
      if (pageType === 'portfolio') {
        category = getRandomItem(dummyPools.portfolio.categories, seed + count);
      } else if (pageType === 'blog') {
        category = getRandomItem(dummyPools.blog.categories, seed + count);
      } else {
        category = '일반';
      }
      count++;
      return category;
    });
    if (count > 0) changes.push(`Sample Category → ${count}개 교체`);
  }
  
  // 3. 현재 페이지 타이틀
  if (modified.includes('현재 페이지 타이틀')) {
    let count = 0;
    modified = modified.replace(/현재 페이지 타이틀/g, () => {
      let title;
      if (pageType === 'blog') {
        title = getRandomItem(dummyPools.blog.titles, seed + count);
      } else if (pageType === 'event') {
        title = getRandomItem(dummyPools.event.names, seed + count);
      } else if (pageType === 'portfolio') {
        title = getRandomItem(dummyPools.portfolio.projects, seed + count);
      } else {
        title = '콘텐츠';
      }
      count++;
      return title;
    });
    if (count > 0) changes.push(`현재 페이지 타이틀 → ${count}개 교체`);
  }
  
  // 4. 섹션 설명 영역입니다
  if (modified.includes('섹션 설명 영역입니다')) {
    let count = 0;
    modified = modified.replace(/섹션 설명 영역입니다\.?/g, () => {
      const desc = getRandomItem(dummyPools.company.descriptions, seed + count);
      count++;
      return desc;
    });
    if (count > 0) changes.push(`섹션 설명 영역 → ${count}개 교체`);
  }
  
  // 5. 제품 이름 / 상품 이름
  if (modified.includes('제품 이름') || modified.includes('상품 이름')) {
    let count = 0;
    modified = modified.replace(/(제품|상품) 이름/g, () => {
      const product = getRandomItem(dummyPools.shop.products, seed + count);
      count++;
      return product;
    });
    modified = modified.replace(/상품 이름 영역.*/g, () => {
      const product = getRandomItem(dummyPools.shop.products, seed + count);
      count++;
      return product;
    });
    if (count > 0) changes.push(`상품/제품 이름 → ${count}개 교체`);
  }
  
  // 6. 이벤트 이름 넣는 영역
  if (modified.includes('이벤트 이름 넣는 영역')) {
    modified = modified.replace(/이벤트 이름 넣는 영역/g, 
      getRandomItem(dummyPools.event.names, seed));
    changes.push('이벤트 이름 교체');
  }
  
  // 7. 브랜드 이름 / 기업 또는 브랜드 이름
  if (modified.includes('브랜드 이름') || modified.includes('기업 또는 브랜드 이름')) {
    let count = 0;
    modified = modified.replace(/(기업 또는 )?브랜드 이름/g, () => {
      const brands = ['오로라', '모던', '네오룩스', '프리미에르', '스타일리시'];
      const brand = brands[(seed + count) % brands.length];
      count++;
      return brand;
    });
    if (count > 0) changes.push(`브랜드 이름 → ${count}개 교체`);
  }
  
  // 8. Category (영문)
  if (modified.includes('>Category<')) {
    modified = modified.replace(/>Category</g, () => {
      const cat = getRandomItem(dummyPools.portfolio.categories, seed);
      return `>${cat}<`;
    });
    changes.push('Category 교체');
  }
  
  // 9. 텍스트 placeholder
  if (modified.includes('>텍스트<') || modified.includes('"텍스트"')) {
    let count = 0;
    modified = modified.replace(/(>|")텍스트(<|")/g, (match, p1, p2) => {
      const texts = ['콘텐츠', '컨텐츠', '내용', '정보'];
      const text = texts[(seed + count) % texts.length];
      count++;
      return `${p1}${text}${p2}`;
    });
    if (count > 0) changes.push(`텍스트 placeholder → ${count}개 교체`);
  }
  
  return { content: modified, changes };
}

// 메인 실행 함수
async function main() {
  const viewsDir = path.join(__dirname, '..', 'templates', 'blog', 'views');
  
  // 남은 파일만 처리
  const targetFiles = [
    'shop-style.html',
    'portfolio-detail-1.html',
    'portfolio-detail-2.html',
    'portfolio-detail-3.html',
    'shop-cart-1.html',
    'shop-cart-2.html',
    'event-list-1.html',
    'company-info-2.html',
    'company-info-3.html',
    'company-info-5.html',
    'price-plan-2.html',
    'shop-list-2.html'
  ];
  
  console.log(`추가 ${targetFiles.length}개 파일 처리 시작...\n`);
  
  for (const file of targetFiles) {
    const filePath = path.join(viewsDir, file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`✗ ${file} 파일 없음`);
      continue;
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    const pageType = getPageType(file);
    
    const result = replaceText(content, pageType, file);
    
    fs.writeFileSync(filePath, result.content);
    
    console.log(`✓ ${file} 처리 완료 (${result.changes.length}개 변경)`);
    if (result.changes.length > 0) {
      result.changes.forEach(c => console.log(`  - ${c}`));
    }
  }
  
  console.log('\n처리 완료!');
}

main().catch(console.error);
