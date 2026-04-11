-- Supabase SQL Editor에서 실행하세요.

-- 1. 비밀 일기장 테이블 생성
CREATE TABLE IF NOT EXISTS public.diary_entries (
    id UUID PRIMARY KEY,
    date DATE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    mood TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS(Row Level Security) 설정
ALTER TABLE public.diary_entries ENABLE ROW LEVEL SECURITY;

-- 관리자 인증을 거친 앱에서만 쓰기 등 제어 가능 (여기선 편의성을 위해 공개 정책 예시)
-- 실제 운영 환경에서는 Auth 연동 후 정책을 제한하세요.
CREATE POLICY "Allow public read-access" ON public.diary_entries FOR SELECT USING (true);
CREATE POLICY "Allow public insert-access" ON public.diary_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update-access" ON public.diary_entries FOR UPDATE USING (true);
CREATE POLICY "Allow public delete-access" ON public.diary_entries FOR DELETE USING (true);

-- 2. 관리자 인증 검증 함수 (RPC) 생성
CREATE OR REPLACE FUNCTION verify_admin_password(input_pw TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 여기에 실제 비밀번호를 하드코딩하여 서버 단에서만 보관합니다.
  -- 클라이언트 자바스크립트 Bundle에 비밀번호가 노출되는 것을 막기 위함입니다.
  RETURN input_pw = '1128'; 
END;
$$;
