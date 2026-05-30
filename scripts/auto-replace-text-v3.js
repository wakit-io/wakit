const fs = require('fs');
const path = require('path');

// 추가 더미 텍스트
const extraPools = {
  brands: ["오로라", "모던", "네오룩스", "프리미에르", "스타일리시", "글로우", "퓨어", "액티브", "트렌디", "모션"],
  headlines: [
    "새로운 컬렉션 출시",
    "이번 시즌 베스트",
    "특별한 할인 이벤트",
    "신상품 입고 안내",
    "한정 수량 특가",
    "프리미엄 라인업",
    "스페셜 에디션",
    "시즌 오프 세일"
  ],
  events: [
    "봄맞이 특별 기획전",
    "여름 시즌 오프",
    "가을 컬렉션 론칭",
    "겨울 윈터 세일",
    "연말 연시 감사제",
    "신규 회원 혜택",
    "리뷰 이벤트 진행중",
    "묶음 배송 특가"
  ],
  products: [
    "오버사이즈 울 코트",
    "미니멀 레더 백",
    "캐시미어 니트",
    "클린 컷 데님",
    "클로그 샌들",
    "린넨 셔츠",
    "퍼프 슬리브 블라우스",
    "와이드 슬랙스"
  ],
  sections: [
    "전문적인 서비스",
    "체계적인 관리",
    "혁신적인 방법",
    "고객 중심 접근",
    "지속 가능한 성장",
    "맞춤형 솔루션",
    "검증된 결과물",
    "신속한 대응"
  ]
};

function getRandom(arr, seed = 0) {
  const index = (seed + Date.now()) % arr.length;
  return arr[index];
}

function getSeedFromFile(filename) {
  let hash = 0;
  for (let i = 0; i < filename.length; i++) {
    const char = filename.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// 특정 패턴 교체
function replacePatterns(content, seed) {
  let count = 0;
  let newContent = content;
  
  // 브랜드 이름
  newContent = newContent.replace(/브랜드 이름/g, () => {
    count++;
    return getRandom(extraPools.brands, seed + count);
  });
  
  // 헤드 카피
  newContent = newContent.replace(/헤드 카피<br>영역 입니다/g, () => {
    count++;
    return getRandom(extraPools.headlines, seed + count);
  });
  
  // 이벤트 이름
  newContent = newContent.replace(/이벤트 이름 넣는 영역/g, () => {
    count++;
    return getRandom(extraPools.events, seed + count);
  });
  
  // 상품 이름
  newContent = newContent.replace(/상품 이름/g, () => {
    count++;
    return getRandom(extraPools.products, seed + count);
  });
  
  // 제품 이름
  newContent = newContent.replace(/제품 이름/g, () => {
    count++;
    return getRandom(extraPools.products, seed + count + 10);
  });
  
  // 섹션 설명
  newContent = newContent.replace(/섹션 설명 영역입니다/g, () => {
    count++;
    return "전문적인 서비스로 고객의 성공을 지원합니다.";
  });
  
  // Sample Project
  newContent = newContent.replace(/Sample Project/g, () => {
    count++;
    return "프로젝트 샘플 " + (count);
  });
  
  // Sample Category
  newContent = newContent.replace(/Sample Category/g, () => {
    count++;
    return getRandom(["브랜딩", "UX/UI", "그래픽", "모션", "편집"], seed + count);
  });
  
  // 현재 페이지 타이틀
  newContent = newContent.replace(/현재 페이지 타이틀/g, () => {
    count++;
    return getRandom(extraPools.headlines, seed + count);
  });
  
  return { content: newContent, count };
}

// 파일 처리
function processFile(filePath) {
  const filename = path.basename(filePath);
  const seed = getSeedFromFile(filename);
  
  let content = fs.readFileSync(filePath, 'utf-8');
  
  const result = replacePatterns(content, seed);
  
  if (result.count > 0) {
    fs.writeFileSync(filePath, result.content);
    console.log(`${filename}: ${result.count}개 추가 변경`);
  }
  
  return result.count;
}

// 메인
const viewsDir = path.join(__dirname, '..', 'templates', 'blog', 'views');
const files = fs.readdirSync(viewsDir)
  .filter(f => f.endsWith('.html'))
  .map(f => path.join(viewsDir, f));

console.log(`2차 처리 시작...\n`);

let total = 0;
for (const file of files) {
  try {
    total += processFile(file);
  } catch (err) {
    console.error(`  ✗ 오류: ${err.message}`);
  }
}

console.log(`\n총 ${total}개 추가 변경 완료`);
