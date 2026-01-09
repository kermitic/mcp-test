# MCP Store Greeting 서버

업체 환영 인사 + 날씨 정보를 제공하는 MCP 서버 및 관리자 웹

## 프로젝트 구조

```
.
├── mcp-server/          # MCP 서버 (Fastify)
├── admin-web/           # 관리자 웹 (React + Vite)
├── supabase/            # DB 스키마
└── README.md
```

## 설정

### 1. Supabase 설정

1. Supabase 프로젝트 생성
2. **테이블 생성 (중요!)**:
   - Supabase 대시보드 → **SQL Editor** 메뉴
   - **New Query** 클릭
   - `supabase/schema.sql` 파일의 내용을 복사하여 붙여넣기
   - **Run** 버튼 클릭하여 실행
   - 성공 메시지 확인
   - **Table Editor**에서 `stores` 테이블이 생성되었는지 확인
3. **이메일 확인 비활성화 (개발 환경 권장)**:
   - Supabase 대시보드 → Authentication → Settings
   - "Enable email confirmations" 체크 해제
   - 또는 "Confirm email"을 "Off"로 설정
4. 환경 변수 설정:
   - `mcp-server/.env`: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`
   - `admin-web/.env`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

**자세한 설정 방법은 `SUPABASE_SETUP.md` 파일 참조**

### 2. 날씨 API 키

- OpenWeather API 키 발급: https://openweathermap.org/api
- `mcp-server/.env`에 `WEATHER_API_KEY` 설정

### 3. 카카오 지도 API 키

- 카카오 개발자 콘솔에서 앱 키 발급
- `admin-web/index.html`의 `YOUR_KAKAO_APP_KEY` 교체

## 배포 (Render.com)

### 1. Render.com에 배포하기

#### 사전 준비

1. [Render.com](https://render.com) 계정 생성
2. GitHub 저장소에 프로젝트 푸시 (또는 Render.com에서 직접 연결)

#### 배포 단계

**방법 1: render.yaml 사용 (권장)**

1. GitHub 저장소에 `render.yaml` 파일이 이미 포함되어 있음
2. Render.com 대시보드 → **New +** → **Blueprint**
3. GitHub 저장소 선택
4. Render가 자동으로 `render.yaml` 설정을 읽어옴
5. 환경 변수 설정:
   - `SUPABASE_URL`: Supabase 프로젝트 URL
   - `SUPABASE_SERVICE_KEY`: Supabase Service Role Key
   - `WEATHER_API_KEY`: OpenWeather API 키
6. **Apply** 클릭하여 배포 시작

**방법 2: 수동 설정**

1. Render.com 대시보드 → **New +** → **Web Service**
2. GitHub 저장소 연결
3. 설정:
   - **Name**: `mcp-server`
   - **Environment**: `Node`
   - **Build Command**: `cd mcp-server && npm install`
   - **Start Command**: `cd mcp-server && npm start`
   - **Plan**: Free (또는 원하는 플랜)
4. 환경 변수 추가:
   - `NODE_ENV`: `production`
   - `PORT`: `10000` (Render.com이 자동 설정하지만 명시적으로 설정 가능)
   - `SUPABASE_URL`: Supabase 프로젝트 URL
   - `SUPABASE_SERVICE_KEY`: Supabase Service Role Key
   - `WEATHER_API_KEY`: OpenWeather API 키
5. **Create Web Service** 클릭

#### 배포 후 확인

- 배포 완료 후 Render.com이 자동으로 HTTPS URL 제공 (예: `https://mcp-server.onrender.com`)
- Health Check: `https://your-app.onrender.com/health`

## 로컬 개발 환경 실행

### 의존성 설치

```bash
npm run install:all
```

### MCP 서버 실행

```bash
npm run dev:mcp
# 또는
cd mcp-server && npm run dev
```

### 관리자 웹 실행

```bash
npm run dev:admin
# 또는
cd admin-web && npm run dev
```

## MCP Tool 사용

### 엔드포인트

`POST /rpc/greet_store`

### 요청

```json
{
  "store_name": "A업체"
}
```

### 응답

```json
{
  "greeting": "반갑습니다, 고객님! A업체입니다.",
  "weather_summary": "A업체(서울시 강남구)는 지금 현재 구름 많음, 23°C"
}
```

## 테스트 방법

### Render.com 배포 서버 테스트

배포된 서버 URL을 사용하여 테스트 (예: `https://mcp-server.onrender.com`)

### 1. Health Check (서버 상태 확인)

```bash
curl https://your-app.onrender.com/health
```

### 2. greet_store 엔드포인트 테스트

**방법 1: curl 사용**

```bash
curl -X POST https://your-app.onrender.com/rpc/greet_store \
  -H "Content-Type: application/json" \
  -d '{"store_name": "테스트업체"}'
```

**방법 2: 테스트 스크립트 사용**

```bash
# Node.js 버전
node test-mcp-server.js https://your-app.onrender.com 테스트업체

# Bash 버전 (Linux/Mac/Git Bash)
bash test-mcp-server.sh https://your-app.onrender.com 테스트업체
```

**방법 3: 브라우저에서 Health Check**
브라우저에서 `https://your-app.onrender.com/health` 접속하여 `{"status":"ok"}` 응답 확인

**방법 4: Postman/Insomnia 사용**

- Method: POST
- URL: `https://your-app.onrender.com/rpc/greet_store`
- Headers: `Content-Type: application/json`
- Body (JSON):

```json
{
  "store_name": "등록한업체명"
}
```

### 로컬 개발 서버 테스트

로컬에서 실행 중인 경우 `http://localhost:3000` 사용

### 3. 예상 응답 예시

```json
{
  "greeting": "반갑습니다, 고객님! 테스트업체입니다.",
  "weather_summary": "테스트업체(서울시 강남구)는 지금 현재 맑음, 25°C"
}
```

## 관리자 웹

- 로컬: http://localhost:5173
- Supabase Auth로 로그인
- 업체 등록 시 주소 자동완성 및 지도에서 위치 선택
- 저장 시 lat/lng 자동 계산 및 저장
