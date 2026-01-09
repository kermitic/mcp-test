-- Stores table
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name TEXT UNIQUE NOT NULL,
  greeting_message TEXT NOT NULL,
  address_text TEXT NOT NULL,
  lat NUMERIC(10, 8),
  lng NUMERIC(11, 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_stores_store_name ON stores(store_name);

-- RLS (Row Level Security) - 관리자만 접근 가능하도록 설정
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Allow authenticated read" ON stores;
DROP POLICY IF EXISTS "Allow authenticated insert" ON stores;
DROP POLICY IF EXISTS "Allow authenticated update" ON stores;
DROP POLICY IF EXISTS "Allow authenticated delete" ON stores;

-- Policy: 인증된 사용자만 조회 가능
CREATE POLICY "Allow authenticated read" ON stores
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy: 인증된 사용자만 삽입 가능
CREATE POLICY "Allow authenticated insert" ON stores
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Policy: 인증된 사용자만 수정 가능
CREATE POLICY "Allow authenticated update" ON stores
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Policy: 인증된 사용자만 삭제 가능
CREATE POLICY "Allow authenticated delete" ON stores
  FOR DELETE
  USING (auth.role() = 'authenticated');
