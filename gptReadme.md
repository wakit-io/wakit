## 컴포넌트 템플릿 반응형 코드로 만들기 순서 

1. 피그마 에서 anima 플러그인을 통해 코드를 가져 온다.(내가 직접함) 

2. figma-export 폴더에 web/mobile 버전에 따라 components 폴더, pages 폴더를 나눔 
    - 컴포넌트폴더는 각각의 요소(아코디언, 헤더, 푸터, 카드, 버튼 등등)들이 있고 페이지폴더는 페이지 별로 코드를 정리 할거

3. components 폴더에 각각의 컴포넌트 별로 나누는데, 폴더 안에 예를 들어 Header 폴더 안에 index.html, style.css 파일을 참고 한다. 

4. figma-export/(web/mobile)/_css/globals.css 파일과 styleguide.css 파일을 참고 한다. 

5. index.html 안에는 모바일코드를 기준으로 모바일 마크업, 그다음으로 PC버전 마크업 을 확인한다 

6. style.css 에는 모바일버전, PC버전 스타일을 확인 한다. 

7. index.html 마크업은 모바일 기준으로 하나의 코드로 단일화 해서 PC버전과 통합한다. 

8. style.css 스타일은 모바일 기준으로 아래 브레이크 포인트로 스타일을 PC버전에 맞에 스타일을 통합한다. 

## 브레이크 포인트 사이즈 

/* 모바일 세로 */
@media (max-width: 480px) { ... }

/* 모바일 가로 & 작은 태블릿 세로 */
@media (min-width: 481px) and (max-width: 767px) { ... }

/* 태블릿 가로 */
@media (min-width: 768px) and (max-width: 1023px) { ... }

/* 작은 데스크톱 / 노트북 */
@media (min-width: 1024px) and (max-width: 1279px) { ... }

/* 일반 데스크톱 */
@media (min-width: 1280px) and (max-width: 1439px) { ... }

/* 대형 모니터 */
@media (min-width: 1440px) { ... }
