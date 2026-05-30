# 퍼블리싱 작업 가이드

## 기본 원칙

**모든 섹션 블록 퍼블리싱 작업 시 반드시 파운데이션 CSS 변수값을 참고하여 디자인해야 합니다.**

직접적인 색상값, 간격값, 폰트 크기 등을 하드코딩하지 말고, `css/foundation/` 폴더에 정의된 CSS 변수를 사용해야 합니다.

---

## 1. 파운데이션 CSS 변수 사용 필수

### 1.1 색상 (Color)

**절대 하드코딩 금지:**
```css
/* ❌ 잘못된 예시 */
.section {
  background-color: #ffffff;
  color: #17191a;
}

/* ✅ 올바른 예시 */
.section {
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
}
```

**사용 가능한 색상 변수:**
- `--color-primary`: Primary 색상
- `--color-text-primary`: 주요 텍스트 색상
- `--color-text-secondary`: 보조 텍스트 색상
- `--color-text-tertiary`: 3차 텍스트 색상
- `--color-bg-primary`: 주요 배경 색상
- `--color-bg-secondary`: 보조 배경 색상
- `--color-bg-tertiary`: 3차 배경 색상
- `--color-bg-dark`: 다크 배경 색상
- `--color-border`: 테두리 색상
- `--color-badge-bg`: 배지 배경 색상
- `--color-badge-text`: 배지 텍스트 색상
- `--color-info`: 정보 색상
- `--color-info-hover`: 정보 호버 색상

**파일 위치:** `css/foundation/color.css`

### 1.2 간격 (Spacing)

**절대 하드코딩 금지:**
```css
/* ❌ 잘못된 예시 */
.section {
  padding: 24px;
  gap: 16px;
  margin-bottom: 48px;
}

/* ✅ 올바른 예시 */
.section {
  padding: var(--spacing-2xl);
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-3xl);
}
```

**사용 가능한 간격 변수:**
- `--spacing-xs`: 4px (1x)
- `--spacing-sm`: 8px (2x)
- `--spacing-md`: 12px (3x)
- `--spacing-lg`: 16px (4x)
- `--spacing-xl`: 20px (5x)
- `--spacing-2xl`: 24px (6x)
- `--spacing-3xl`: 48px (12x)
- `--spacing-container-sm`: 16px
- `--spacing-container-md`: 24px
- `--spacing-container-lg`: 48px
- `--spacing-section-gap`: 20px
- `--spacing-section-padding`: 24px

**파일 위치:** `css/foundation/spacing.css`

### 1.3 타이포그래피 (Typography)

**절대 하드코딩 금지:**
```css
/* ❌ 잘못된 예시 */
.title {
  font-size: 48px;
  font-weight: 700;
  line-height: 60px;
  font-family: "Pretendard", Helvetica;
}

/* ✅ 올바른 예시 */
.title {
  font-family: var(--font-family-primary), var(--font-family-fallback);
  font-size: var(--headline-s-font-size);
  font-weight: var(--headline-s-font-weight);
  line-height: var(--headline-s-line-height);
  letter-spacing: var(--headline-s-letter-spacing);
}
```

**사용 가능한 타이포그래피 변수:**
- `--hero-*`: Hero 텍스트 스타일
- `--headline-l-*`, `--headline-m-*`, `--headline-s-*`: Headline 스타일
- `--title-1-*`, `--title-2-*`, `--title-3-*`: Title 스타일
- `--label-l-*`, `--label-m-*`, `--label-s-*`: Label 스타일
- `--body-1-*`, `--body-2-*`: Body 텍스트 스타일
- `--button-1-*`, `--button-2-*`, `--button-3-*`: Button 텍스트 스타일
- `--caption-l-*`, `--caption-m-*`, `--caption-s-*`: Caption 스타일

각 스타일은 다음 속성을 포함:
- `-font-family`
- `-font-size`
- `-font-weight`
- `-line-height`
- `-letter-spacing`
- `-font-style`

**파일 위치:** `css/foundation/typography.css`

### 1.4 효과 (Effect)

**절대 하드코딩 금지:**
```css
/* ❌ 잘못된 예시 */
.card {
  border-radius: 12px;
  box-shadow: 0px 4px 12px 0px rgba(0, 0, 0, 0.1);
}

/* ✅ 올바른 예시 */
.card {
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-2);
}
```

**사용 가능한 효과 변수:**
- `--radius-xs`: 4px
- `--radius-sm`: 5px
- `--radius-md`: 8px
- `--radius-lg`: 12px
- `--radius-xl`: 24px
- `--radius-full`: 9999px
- `--shadow-1`, `--shadow-2`, `--shadow-3`, `--shadow-4`: 그림자

**파일 위치:** `css/foundation/effect.css`

### 1.5 레이아웃 (Layout)

**사용 가능한 레이아웃 변수:**
- `--breakpoint-*`: 브레이크포인트
- `--container-*`: 컨테이너 너비
- `--size-icon-*`: 아이콘 크기
- `--size-button-height-*`: 버튼 높이

**파일 위치:** `css/foundation/layout.css`

---

## 2. 반응형 디자인 필수

모든 섹션은 반드시 반응형으로 구현해야 합니다.

### 2.1 브레이크포인트

```css
/* 모바일 (기본) */
.section {
  /* 모바일 스타일 */
}

/* 태블릿 */
@media (min-width: 768px) and (max-width: 1023px) {
  .section {
    /* 태블릿 스타일 */
  }
}

/* 데스크톱 */
@media (min-width: 1024px) {
  .section {
    /* 데스크톱 스타일 */
  }
}

/* 대형 모니터 */
@media (min-width: 1440px) {
  .section {
    /* 대형 모니터 스타일 */
  }
}
```

### 2.2 모바일 우선 접근법

- 기본 스타일은 모바일용으로 작성
- 미디어 쿼리로 큰 화면 스타일 추가
- `max-width` 기준으로 작성 (모바일 → 태블릿 → 데스크톱)

---

## 3. 다크모드/라이트모드 지원 필수

**기본 모드는 라이트 모드입니다.** 모든 섹션은 다크모드와 라이트모드를 모두 지원해야 하며, 기본값은 라이트 모드로 설정해야 합니다.

### 3.1 CSS 변수 패턴

```css
/* 라이트 모드 변수 (기본) - :root에 라이트 모드 기본값 설정 */
:root {
  --section-bg: var(--color-bg-primary);
  --section-text: var(--color-text-primary);
}

/* 다크 모드 변수 - [data-theme="dark"]에서 다크 모드 값으로 오버라이드 */
[data-theme="dark"] {
  --section-bg: var(--color-bg-dark);
  --section-text: var(--color-text-primary);
}

/* 실제 사용 */
.section {
  background-color: var(--section-bg);
  color: var(--section-text);
}
```

### 3.2 섹션별 변수 정의

각 섹션마다 고유한 CSS 변수를 정의하여 다크모드 지원:

```css
/* 섹션 변수 정의 */
:root {
  --my-section-bg: var(--color-bg-primary);
  --my-section-text-primary: var(--color-text-primary);
  --my-section-text-secondary: var(--color-text-secondary);
}

[data-theme="dark"] {
  --my-section-bg: var(--color-bg-dark);
  --my-section-text-primary: var(--color-text-primary);
  --my-section-text-secondary: var(--color-text-secondary);
}

/* 사용 */
.my-section {
  background-color: var(--my-section-bg);
  color: var(--my-section-text-primary);
}
```

---

## 4. 섹션 구조 패턴

### 4.1 기본 구조

```html
<section class="my-section">
  <div class="my-section__container container">
    <!-- 섹션 내용 -->
  </div>
</section>
```

### 4.2 CSS 구조

```css
/* ============================================
   My Section
   ============================================ */

/* 섹션 변수 정의 - Light Mode (기본) */
:root {
  --my-section-bg: var(--color-bg-primary);
  --my-section-text-primary: var(--color-text-primary);
}

/* Dark Mode */
[data-theme="dark"] {
  --my-section-bg: var(--color-bg-dark);
  --my-section-text-primary: var(--color-text-primary);
}

/* 섹션 기본 스타일 */
.my-section {
  position: relative;
  width: 100%;
  background-color: var(--my-section-bg);
  padding: calc(var(--spacing-3xl) + var(--spacing-3xl)) 0;
}

.my-section__container {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 0 var(--spacing-2xl);
}

/* 모바일 스타일 */
@media (max-width: 1023px) {
  .my-section {
    padding: var(--spacing-xl) 0;
  }

  .my-section__container {
    padding: 0 var(--spacing-lg);
  }
}

/* 데스크톱 스타일 */
@media (min-width: 1024px) {
  .my-section {
    padding: calc(var(--spacing-3xl) + var(--spacing-3xl)) 0;
  }
}
```

---

## 5. 네이밍 컨벤션

### 5.1 BEM 방법론 사용

- Block: `section-name`
- Element: `section-name__element-name`
- Modifier: `section-name--modifier-name`

### 5.2 예시

```css
.hero-section { }
.hero-section__container { }
.hero-section__content { }
.hero-section__title { }
.hero-section__button { }
.hero-section__button--primary { }
```

---

## 6. 이미지 처리

### 6.1 이미지 로딩 체크

모든 이미지는 로딩 상태를 체크하고 플레이스홀더를 제공해야 합니다:

```html
<div class="section__image-wrapper">
  <img src="..." alt="..." class="section__image" loading="lazy" />
  <div class="section__placeholder">
    <div class="section__placeholder-icon"></div>
  </div>
</div>
```

```javascript
// 이미지 로딩 체크 스크립트
(function() {
  const image = document.querySelector('.section__image');
  const placeholder = document.querySelector('.section__placeholder');
  
  if (!image || !placeholder) return;

  function checkImageLoad() {
    if (image.complete && image.naturalHeight !== 0) {
      placeholder.classList.add('hidden');
    } else {
      image.addEventListener('load', () => {
        placeholder.classList.add('hidden');
      });
      image.addEventListener('error', () => {
        placeholder.classList.add('hidden');
      });
    }
  }

  checkImageLoad();
})();
```

---

## 7. 접근성 (Accessibility)

### 7.1 Reduced Motion 지원

```css
@media (prefers-reduced-motion: reduce) {
  .section__element {
    transition: none;
    animation: none;
  }
}
```

### 7.2 Print 스타일

```css
@media print {
  .section {
    background-color: var(--color-bg-primary);
  }
  
  .section__image {
    display: none;
  }
}
```

---

## 8. 체크리스트

섹션 작업 완료 후 다음 항목을 확인:

- [ ] 모든 색상값이 파운데이션 CSS 변수 사용
- [ ] 모든 간격값이 파운데이션 CSS 변수 사용
- [ ] 모든 타이포그래피가 파운데이션 CSS 변수 사용
- [ ] 반응형 디자인 구현 (모바일, 태블릿, 데스크톱)
- [ ] 기본 모드가 라이트 모드로 설정됨 (`:root`에 라이트 모드 변수 정의)
- [ ] 다크모드/라이트모드 지원 (`[data-theme="dark"]`에서 다크 모드 변수 오버라이드)
- [ ] CSS 변수로 섹션별 테마 정의
- [ ] 이미지 로딩 체크 스크립트 포함
- [ ] 접근성 고려 (reduced motion, print 스타일)
- [ ] BEM 네이밍 컨벤션 준수
- [ ] 하드코딩된 값 없음

---

## 9. 참고 파일

- **파운데이션 CSS 변수:** `templates/blog/css/foundation/`
- **기존 섹션 예시:** `templates/blog/css/company-info-4.css`
- **HTML 구조 예시:** `templates/blog/views/company-info-4.html`

---

## 10. 주의사항

1. **절대 하드코딩 금지**: 색상, 간격, 폰트 크기 등을 직접 숫자로 작성하지 말 것
2. **파운데이션 변수 우선**: 모든 스타일은 파운데이션 CSS 변수를 우선적으로 사용
3. **일관성 유지**: 기존 섹션의 패턴과 스타일을 일관되게 유지
4. **반응형 필수**: 모든 섹션은 반드시 반응형으로 구현
5. **기본 모드는 라이트 모드**: 모든 섹션의 기본값은 라이트 모드로 설정하고, `:root`에 라이트 모드 변수를 정의해야 함
6. **다크모드 필수**: 모든 섹션은 다크모드를 지원해야 하며, `[data-theme="dark"]`에서 다크 모드 변수로 오버라이드
7. **브랜드명 치환**: 모든 템플릿에서 "Supernormal" 또는 "슈퍼노멀"로 표기된 문구는 "WAKIT CMS"로 치환하여 사용