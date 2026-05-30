-- app_demo 스키마 생성
CREATE SCHEMA IF NOT EXISTS app_demo;
GRANT USAGE ON SCHEMA app_demo TO anon, authenticated;

-- app_demo 스토리지 버킷 생성
INSERT INTO storage.buckets (id, name, public)
VALUES ('app_demo', 'app_demo', false)
ON CONFLICT (id) DO NOTHING;