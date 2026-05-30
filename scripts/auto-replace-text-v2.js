const fs = require('fs');
const path = require('path');

// 더미 텍스트 풀
const textPools = {
  titles: [
    "새로운 시작을 함께해요",
    "더 나은 내일을 향해",
    "변화를 만드는 순간",
    "성장하는 이야기",
    "함께하는 여정",
    "도전과 성취의 기록",
    "무한한 가능성의 시작",
    "꿈을 향한 첫걸음",
    "혁신적인 접근",
    "창의적인 해결책",
    "전문적인 파트너십",
    "신뢰할 수 있는 동반자",
    "미래를 향한 도전",
    "성공을 위한 파트너",
    "가치 있는 선택"
  ],
  descriptions: [
    "새로운 아이디어와 혁신적인 방법으로 당신의 목표를 달성하는 데 도움을 드립니다.",
    "전문적인 노하우와 경험을 바탕으로 최적의 솔루션을 제공합니다.",
    "고객 중심의 접근 방식으로 꼭 맞는 서비스를 제안합니다.",
    "끊임없는 연구와 개발로 더 나은 결과를 만들어갑니다.",
    "효율적인 프로세스와 체계적인 관리로 성공을 지원합니다.",
    "창의적인 아이디어와 실행력으로 차별화된 가치를 제공합니다.",
    "협업과 소통을 통해 최상의 결과물을 만들어갑니다.",
    "지속적인 개선과 혁신으로 발전하는 파트너가 되겠습니다.",
    "단순한 서비스를 넘어 성장의 동반자가 되겠습니다.",
    "데이터 기반의 통찰력으로 현명한 결정을 돕습니다.",
    "체계적인 접근 방식으로 복잡한 문제를 해결합니다.",
    "전문가들의 노하우로 검증된 결과를 제공합니다."
  ],
  shortTexts: [
    "효율적인 관리",
    "체계적인 접근",
    "전문적인 지원",
    "혁신적인 방법",
    "고객 중심 서비스",
    "지속 가능한 성장",
    "맞춤형 솔루션",
    "검증된 결과",
    "신속한 대응",
    "세심한 관리",
    "전문적인 컨설팅",
    "체계적인 분석",
    "효과적인 전략",
    "안정적인 운영",
    "혁신적인 도구"
  ]
};

// 랜덤 선택
function getRandom(arr, seed = 0) {
  const index = (seed + Date.now()) % arr.length;
  return arr[index];
}

// 파일명에서 시드 생성
function getSeedFromFile(filename) {
  let hash = 0;
  for (let i = 0; i < filename.length; i++) {
    const char = filename.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// h1-h3 태그 교체
function replaceHeadings(content, seed) {
  let count = 0;
  let newContent = content.replace(/<(h[123])[^>]*>([^<]+)<\/\1>/gi, (match, tag, text) => {
    const trimmed = text.trim();
    if (trimmed.length > 3 && !trimmed.match(/(버튼|Button|확인|취소|닫기)/i)) {
      const newText = getRandom(textPools.titles, seed + count);
      count++;
      return `<${tag}>${newText}</${tag}>`;
    }
    return match;
  });
  return { content: newContent, count };
}

// p 태그 교체
function replaceParagraphs(content, seed) {
  let count = 0;
  let newContent = content.replace(/<p[^>]*>([^<]+)<\/p>/gi, (match, text) => {
    const trimmed = text.trim();
    if (trimmed.length > 20 && !trimmed.includes('버튼') && !trimmed.includes('Badge')) {
      const newText = getRandom(textPools.descriptions, seed + count);
      count++;
      return `<p>${newText}</p>`;
    }
    return match;
  });
  return { content: newContent, count };
}

// span 태그 교체 (버튼/뱃지 제외)
function replaceSpans(content, seed) {
  let count = 0;
  let newContent = content.replace(/<span[^>]*>([^<]{5,50})<\/span>/gi, (match, text) => {
    const trimmed = text.trim();
    if (!trimmed.match(/(버튼|Button|확인|취소|닫기|Badge|뱃지|New|Hot)/i)) {
      const newText = getRandom(textPools.shortTexts, seed + count);
      count++;
      return match.replace(text, newText);
    }
    return match;
  });
  return { content: newContent, count };
}

// alt 속성 교체
function replaceAlts(content, seed) {
  let count = 0;
  let newContent = content.replace(/alt="([^"]{5,})"/gi, (match, text) => {
    if (!text.match(/(버튼|Button|로고|Logo|아이콘|Icon)/i)) {
      const newText = "이미지";
      count++;
      return `alt="${newText}"`;
    }
    return match;
  });
  return { content: newContent, count };
}

// 파일 처리
function processFile(filePath) {
  const filename = path.basename(filePath);
  console.log(`\n처리 중: ${filename}`);
  
  let content = fs.readFileSync(filePath, 'utf-8');
  const seed = getSeedFromFile(filename);
  
  let totalChanges = 0;
  
  // h1-h3 교체
  const headings = replaceHeadings(content, seed);
  content = headings.content;
  totalChanges += headings.count;
  
  // p 태그 교체
  const paragraphs = replaceParagraphs(content, seed + 100);
  content = paragraphs.content;
  totalChanges += paragraphs.count;
  
  // span 태그 교체
  const spans = replaceSpans(content, seed + 200);
  content = spans.content;
  totalChanges += spans.count;
  
  // alt 교체
  const alts = replaceAlts(content, seed + 300);
  content = alts.content;
  totalChanges += alts.count;
  
  // 저장
  fs.writeFileSync(filePath, content);
  
  console.log(`  ✓ ${totalChanges}개 변경`);
  return totalChanges;
}

// 메인
const viewsDir = path.join(__dirname, '..', 'templates', 'blog', 'views');
const files = fs.readdirSync(viewsDir)
  .filter(f => f.endsWith('.html'))
  .map(f => path.join(viewsDir, f));

console.log(`총 ${files.length}개 파일 처리 시작...`);

let total = 0;
for (const file of files) {
  try {
    total += processFile(file);
  } catch (err) {
    console.error(`  ✗ 오류: ${err.message}`);
  }
}

console.log(`\n\n=== 완료 ===`);
console.log(`총 파일: ${files.length}개`);
console.log(`총 변경: ${total}개`);
