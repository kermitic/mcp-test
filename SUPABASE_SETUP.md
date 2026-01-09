# Supabase 설정 가이드

## 1. 테이블 생성

Supabase 대시보드에서 다음 단계를 따르세요:

1. **Supabase 대시보드 접속** → 프로젝트 선택
2. **SQL Editor** 메뉴 클릭
3. **New Query** 클릭
4. 아래 SQL을 복사하여 실행:

```sql
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
```

5. **Run** 버튼 클릭하여 실행
6. 성공 메시지 확인

## 2. 테이블 생성 확인

1. **Table Editor** 메뉴 클릭
2. `stores` 테이블이 보이는지 확인
3. 테이블 구조 확인:
   - id (uuid)
   - store_name (text)
   - greeting_message (text)
   - address_text (text)
   - lat (numeric)
   - lng (numeric)
   - created_at (timestamp)

## 3. RLS 정책 확인

1. **Authentication** → **Policies** 메뉴
2. `stores` 테이블의 정책 확인
3. 4개의 정책이 모두 활성화되어 있는지 확인

## 4. 문제 해결

### "Could not find the table 'public.stores'" 에러가 발생하는 경우:

1. **테이블이 생성되었는지 확인**

   - Table Editor에서 `stores` 테이블 확인
   - 없다면 위의 SQL을 다시 실행

2. **스키마 캐시 문제**

   - Supabase 대시보드에서 프로젝트 재시작
   - 또는 몇 분 기다린 후 다시 시도

3. **RLS 정책 확인**

   - Policies에서 정책이 올바르게 설정되었는지 확인
   - 필요시 정책을 삭제하고 다시 생성

4. **환경 변수 확인**
   - `VITE_SUPABASE_URL`이 올바른지 확인
   - `VITE_SUPABASE_ANON_KEY`가 올바른지 확인
