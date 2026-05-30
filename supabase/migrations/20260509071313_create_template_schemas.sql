-- 템플릿별 스키마 생성
CREATE SCHEMA IF NOT EXISTS app_test;
CREATE SCHEMA IF NOT EXISTS app_hotel;
CREATE SCHEMA IF NOT EXISTS app_basic;
CREATE SCHEMA IF NOT EXISTS app_theme;

-- 각 스키마에 대한 접근 권한 설정
GRANT USAGE ON SCHEMA app_test  TO anon, authenticated;
GRANT USAGE ON SCHEMA app_hotel TO anon, authenticated;
GRANT USAGE ON SCHEMA app_basic TO anon, authenticated;
GRANT USAGE ON SCHEMA app_theme TO anon, authenticated;
