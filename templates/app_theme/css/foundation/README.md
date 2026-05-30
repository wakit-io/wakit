# Foundation Design Tokens

Figma의 Foundation 섹션에 정의된 디자인 토큰을 CSS 변수로 모듈화한 파일들입니다.

## 구조

```
foundation/
├── index.css      # 모든 Foundation 토큰 통합 파일
├── color.css      # Color 토큰
├── spacing.css    # Spacing 토큰
├── typography.css # Typography 토큰
├── effect.css     # Effect (Shadow, Border Radius 등) 토큰
├── layout.css     # Screen & Layout Grids 토큰
├── icons.css      # Icons 토큰
└── graphic.css    # Graphic 토큰
```

## 사용법

### 전체 Foundation 토큰 사용

```html
<link rel="stylesheet" href="_css/foundation/index.css">
```

또는 CSS에서:

```css
@import './foundation/index.css';
```

### 개별 모듈 사용

필요한 모듈만 선택적으로 import:

```css
@import './foundation/color.css';
@import './foundation/spacing.css';
```

## 사용 예시

### Color 사용

```css
.button-primary {
  background-color: var(--color-primary);
  color: var(--color-text-on-primary);
  border: 1px solid var(--color-border);
}
```

### Spacing 사용

```css
.card {
  padding: var(--spacing-lg) var(--spacing-2xl);
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}
```

### Typography 사용

```css
.heading {
  font-family: var(--headline-l-font-family);
  font-size: var(--headline-l-font-size);
  font-weight: var(--headline-l-font-weight);
  line-height: var(--headline-l-line-height);
}
```

### Effect 사용

```css
.card {
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-2);
}
```

### Layout 사용

```css
.container {
  max-width: var(--container-lg);
  padding: var(--spacing-container-md);
}

@media (min-width: 768px) {
  .container {
    max-width: var(--container-xl);
  }
}
```

## Figma와 동기화

1. **Color**: Figma의 Color 스타일과 CSS 변수 값을 동일하게 유지
2. **Typography**: Figma의 Text 스타일과 CSS 변수 값을 동일하게 유지
3. **Effect**: Figma의 Effect 스타일과 CSS 변수 값을 동일하게 유지
4. **Spacing**: Figma의 간격 가이드와 CSS 변수 값을 동일하게 유지

## 업데이트 방법

Figma에서 디자인 토큰이 변경되면:

1. 해당 Foundation 섹션의 값을 확인
2. 관련 CSS 파일의 변수 값 업데이트
3. 변경 사항을 프로젝트 전체에 반영

예: Figma에서 Primary 색상이 `#006fff`에서 `#0070ff`로 변경되면:

```css
/* foundation/color.css */
--color-primary: #0070ff; /* 업데이트 */
```

## 주의사항

- CSS 변수 이름은 의미있고 일관되게 유지
- Figma의 네이밍과 가능한 한 일치시키기
- 새로운 토큰 추가 시 관련 문서 업데이트
