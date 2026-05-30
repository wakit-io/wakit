# Template Views – 버튼 디자인 포함 파일 정리

`views/` 폴더 내 **버튼(button/btn) 디자인**이 사용된 HTML 파일 목록입니다.  
버튼 사용 빈도(매칭 건수) 기준으로 정리했습니다.

---

## 버튼 사용 많은 순 (상위 20)

| 순위 | 파일명 | 비고 |
|------|--------|------|
| 1 | `shop-list-2.html` | 쇼핑 리스트 – 필터/정렬/CTA 버튼 다수 |
| 2 | `shop-list-4.html` | 쇼핑 리스트 |
| 3 | `community-list-1.html` | 커뮤니티 리스트 – 글쓰기/필터 버튼 |
| 4 | `shop-detail-1.html` | 상품 상세 – 장바구니/찜/공유 등 액션 버튼 |
| 5 | `shop-list-1.html` | 쇼핑 리스트 |
| 6 | `shop-detail-2.html` | 상품 상세 |
| 7 | `shop-main-4.html` | 쇼핑 메인 |
| 8 | `community-list-3.html` | 커뮤니티 리스트 |
| 9 | `my-order-history.html` | 마이페이지 주문 내역 |
| 10 | `shop-main-1.html` | 쇼핑 메인 |
| 11 | `shop-main-2.html` | 쇼핑 메인 |
| 12 | `shop-main-3.html` | 쇼핑 메인 |
| 13 | `event-list-1.html` | 이벤트 리스트 |
| 14 | `blog-list-2.html` | 블로그 리스트 |
| 15 | `blog-list-1.html` | 블로그 리스트 |
| 16 | `community-list-2.html` | 커뮤니티 리스트 |
| 17 | `my-selling-product.html` | 마이페이지 판매 상품 |
| 18 | `company-info-3.html` | 회사 소개 – CTA/카드 버튼 |
| 19 | `blog-list-3.html` | 블로그 리스트 |
| 20 | `my-interest-store.html` | 마이페이지 관심 스토어 |

---

## 카테고리별 정리

### 쇼핑 (Shop)
- `shop-detail-1.html`, `shop-detail-2.html`, `shop-detail-3.html`
- `shop-list-1.html`, `shop-list-2.html`, `shop-list-3.html`, `shop-list-4.html`
- `shop-main-1.html` ~ `shop-main-5.html`
- `shop-cart-1.html`, `shop-cart-2.html`
- `shop-payment-1.html`, `shop-payment-2.html`
- `shop-customer-center.html`, `shop-style.html`, `shop-magazine.html`
- `shop-offline-store.html`, `shop-product-review.html`, `shop-notice.html`

### 마이페이지 (My)
- `my-dashboard.html`, `my-order-history.html`, `my-received.html`
- `my-interest-product.html`, `my-interest-store.html`, `my-selling-product.html`
- `my-review-write.html`, `profile.html`

### 블로그 (Blog)
- `blog-list-1.html` ~ `blog-list-7.html`
- `blog-detail-1.html` ~ `blog-detail-5.html`

### 커뮤니티 (Community)
- `community-list-1.html`, `community-list-2.html`, `community-list-3.html`
- `community-detail.html`, `community.html`

### 이벤트 (Event)
- `event-list-1.html`, `event-list-2.html`, `event-list-3.html`
- `event-detail-1.html`, `event-detail-2.html`, `event-detail-3.html`

### 포트폴리오 (Portfolio)
- `portfolio-list-1.html` ~ `portfolio-list-4.html`
- `portfolio-detail-1.html`, `portfolio-detail-2.html`, `portfolio-detail-3.html`

### 회사/서비스 (Company & Service)
- `company-info-1.html`, `company-info-2.html`, `company-info-3.html`, `company-info-5.html`
- `service-1.html`, `service-2.html`, `service-3.html`

### 가격/플랜 (Price Plan)
- `price-plan-1.html` ~ `price-plan-5.html`

### 문의/고객지원 (Contact & Support)
- `contact.html`, `contact-2.html`, `contact-3.html`, `contact-4.html`
- `faq.html`, `faq-2.html`

### 회원/인증 (Auth)
- `login.html`, `join.html`, `password.html`, `password-re.html`

### 기타
- `page-map.html`, `terms.html`, `privacy.html`
- `error-404.html`, `error-500.html`, `detail.html`

---

## 버튼 스타일이 정의된 CSS (참고)

- `css/shop-detail-1.css` – `.btn`, `.btn-primary`, `.btn-outline`, `.icon-button`
- `css/shop-detail-3.css` – `.button`, `.button--primary`, `.button--secondary`
- `css/shop-payment-2.css` – `.button`, `.button-group`
- `css/company-info-3.css` – `.product-card__btn`, primary/secondary
- `css/contact.css` – `.contact-cta-button`, primary/secondary
- `css/login.css`, `css/join.css`, `css/password.css` – 폼 제출/보조 버튼
- `css/style.css` – 공통 버튼 유틸

---

*생성일: 2025-02-16 | views 폴더 기준*
