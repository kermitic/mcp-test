-- Enable pg_trgm extension for similarity search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

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

-- GIN index for similarity search using pg_trgm
CREATE INDEX IF NOT EXISTS idx_stores_store_name_gin ON stores USING gin(store_name gin_trgm_ops);

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

-- RPC function for similarity search using pg_trgm
CREATE OR REPLACE FUNCTION search_similar_store(
  search_name TEXT,
  similarity_threshold NUMERIC DEFAULT 0.3
)
RETURNS TABLE (
  store_name TEXT,
  greeting_message TEXT,
  address_text TEXT,
  lat NUMERIC,
  lng NUMERIC,
  score NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.store_name,
    s.greeting_message,
    s.address_text,
    s.lat,
    s.lng,
    similarity(s.store_name, search_name) as score
  FROM stores s
  WHERE similarity(s.store_name, search_name) > similarity_threshold
  ORDER BY score DESC
  LIMIT 1;
END;
$$;
