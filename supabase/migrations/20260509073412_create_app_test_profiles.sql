-- app_test 프로필 테이블
CREATE TABLE IF NOT EXISTS app_test.profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username   text NOT NULL UNIQUE,
  email      text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- RLS 활성화
ALTER TABLE app_test.profiles ENABLE ROW LEVEL SECURITY;

-- 본인 프로필만 조회 가능
CREATE POLICY "profiles_select_own" ON app_test.profiles
  FOR SELECT USING (auth.uid() = id);

-- 본인 프로필만 수정 가능
CREATE POLICY "profiles_update_own" ON app_test.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 회원가입 시 profiles 자동 생성 트리거
CREATE OR REPLACE FUNCTION app_test.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO app_test.profiles (id, username, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION app_test.handle_new_user();
