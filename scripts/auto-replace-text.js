const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

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
    "신뢰할 수 있는 동반자"
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
    "데이터 기반의 통찰력으로 현명한 결정을 돕습니다."
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
    "세심한 관리"
  ],
  altTexts: [
    "메인 이미지",
    "콘텐츠 이미지",
    "프로젝트 이미지",
    "서비스 이미지",
    "배너 이미지",
    "상품 이미지",
    "팀 이미지",
    "일러스트레이션",
    "배경 이미지",
    "썸네일 이미지"
  ]
};

// 랜덤 선택
function getRandom(arr, seed = 0) {
  const index = (Math.abs(seed) + Date.now()) % arr.length;
  return arr[index];
}

// 텍스트가 교체 대상인지 확인 (버튼, 뱃지 제외)
function shouldReplace($, el) {
  const $el = $(el);
  
  // 버튼 날짜 텍스트 제외
  if ($el.closest('button, .btn, [role="button"]').length > 0) return false;
  if ($el.closest('.badge, .tag, .label').length > 0) return false;
  
  // 네비게이션 메뉴 제외
  if ($el.closest('nav, .nav, .navigation, .menu').length > 0) return false;
  
  // 스크립트, 스타일 제외
  if ($el.closest('script, style').length > 0) return false;
  
  // 짧은 텍스트(2글자 이하) 제외
  const text = $el.text().trim();
  if (text.length <= 2) return false;
  
  // 실제 의미 있는 텍스트만
  if (!text.match(/[가-힣a-zA-Z]{3,}/)) return false;
  
  return true;
}

// 메인 처리 함수
async function processFile(filePath, index) {
  console.log(`\n[${index + 1}] 처리 중: ${path.basename(filePath)}`);
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const $ = cheerio.load(content, { decodeEntities: false });
  
  let changes = 0;
  
  // 1. h1-h3 태그 처리
  $('h1, h2, h3').each((i, el) => {
    if (shouldReplace($, el)) {
      const oldText = $(el).text().trim();
      const newText = getRandom(textPools.titles, index + i);
      $(el).text(newText);
      console.log(`  ✓ h${el.tagName === 'h1' ? 1 : el.tagName === 'h2' ? 2 : 3}: "${oldText.substring(0, 30)}..." → "${newText}"`);
      changes++;
    }
  });
  
  // 2. p 태그 처리 (설명문)
  $('p').each((i, el) => {
    if (shouldReplace($, el)) {
      const oldText = $(el).text().trim();
      if (oldText.length > 20) {
        const newText = getRandom(textPools.descriptions, index + i);
        $(el).text(newText);
        console.log(`  ✓ p: "${oldText.substring(0, 30)}..." → "${newText.substring(0, 30)}..."`);
        changes++;
      }
    }
  });
  
  // 3. span 태그 처리 (짧은 설명)
  $('span').each((i, el) => {
    if (shouldReplace($, el)) {
      const oldText = $(el).text().trim();
      if (oldText.length > 5 && oldText.length < 50) {
        const newText = getRandom(textPools.shortTexts, index + i);
        $(el).text(newText);
        console.log(`  ✓ span: "${oldText}" → "${newText}"`);
        changes++;
      }
    }
  });
  
  // 4. alt 속성 처리
  $('img[alt]').each((i, el) => {
    const oldAlt = $(el).attr('alt');
    if (oldAlt && oldAlt.length > 3) {
      const newAlt = getRandom(textPools.altTexts, index + i);
      $(el).attr('alt', newAlt);
      console.log(`  ✓ alt: "${oldAlt}" → "${newAlt}"`);
      changes++;
    }
  });
  
  // 5. aria-label 속성 처리
  $('[aria-label]').each((i, el) => {
    const oldLabel = $(el).attr('aria-label');
    if (oldLabel && oldLabel.length > 3 && !oldLabel.match(/(이전|다음|닫기|열기|확인|취소)/)) {
      const newLabel = getRandom(textPools.shortTexts, index + i);
      $(el).attr('aria-label', newLabel);
      console.log(`  ✓ aria-label: "${oldLabel}" → "${newLabel}"`);
      changes++;
    }
  });
  
  // 변경된 내용 저장
  fs.writeFileSync(filePath, $.html());
  console.log(`  총 ${changes}개 변경 완료`);
  
  return changes;
}

// 메인 실행
async function main() {
  const viewsDir = path.join(__dirname, '..', 'templates', 'blog', 'views');
  const files = fs.readdirSync(viewsDir)
    .filter(f => f.endsWith('.html'))
    .map(f => path.join(viewsDir, f));
  
  console.log(`총 ${files.length}개 파일 처리 시작...\n`);
  
  let totalChanges = 0;
  
  for (let i = 0; i < files.length; i++) {
    try {
      const changes = await processFile(files[i], i);
      totalChanges += changes;
    } catch (err) {
      console.error(`  ✗ 오류: ${err.message}`);
    }
  }
  
  console.log(`\n\n=== 처리 완료 ===`);
  console.log(`총 파일: ${files.length}개`);
  console.log(`총 변경: ${totalChanges}개`);
}

main().catch(console.error);
