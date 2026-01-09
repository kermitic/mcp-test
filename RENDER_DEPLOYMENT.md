# Render.com 배포 가이드

이 문서는 MCP 서버를 Render.com에 배포하는 방법을 설명합니다.

## 사전 준비

1. **Render.com 계정 생성**
   - [Render.com](https://render.com) 접속
   - GitHub 계정으로 로그인 (권장)

2. **GitHub 저장소 준비**
   - 프로젝트를 GitHub에 푸시
   - 또는 Render.com에서 직접 Git 저장소 연결

3. **환경 변수 준비**
   - Supabase URL 및 Service Key
   - OpenWeather API Key

## 배포 방법

### 방법 1: render.yaml 사용 (권장)

`render.yaml` 파일이 프로젝트 루트에 포함되어 있어 자동 배포가 가능합니다.

#### 단계

1. **GitHub에 프로젝트 푸시**
   ```bash
   git add .
   git commit -m "Add render.yaml for deployment"
   git push origin main
   ```

2. **Render.com에서 Blueprint 생성**
   - Render.com 대시보드 접속
   - **New +** 버튼 클릭
   - **Blueprint** 선택
   - GitHub 저장소 선택 및 연결
   - Render가 자동으로 `render.yaml` 파일을 인식

3. **환경 변수 설정**
   - 배포 설정 화면에서 **Environment** 섹션으로 이동
   - 다음 환경 변수 추가:
     ```
     SUPABASE_URL=your-supabase-url
     SUPABASE_SERVICE_KEY=your-supabase-service-key
     WEATHER_API_KEY=your-weather-api-key
     ```
   - 각 변수는 **Sync** 옵션이 `false`로 설정되어 있으므로 수동으로 입력 필요

4. **배포 시작**
   - **Apply** 버튼 클릭
   - 배포 진행 상황 확인
   - 배포 완료 후 서비스 URL 확인 (예: `https://mcp-server.onrender.com`)

### 방법 2: 수동 설정

#### 단계

1. **Render.com 대시보드 접속**
   - [Render.com Dashboard](https://dashboard.render.com) 접속

2. **새 Web Service 생성**
   - **New +** 버튼 클릭
   - **Web Service** 선택

3. **저장소 연결**
   - GitHub 저장소 선택
   - 또는 Git 저장소 URL 입력

4. **서비스 설정**
   - **Name**: `mcp-server` (원하는 이름)
   - **Region**: 가장 가까운 지역 선택
   - **Branch**: `main` (또는 기본 브랜치)
   - **Root Directory**: (비워두기 - 루트 디렉토리 사용)
   - **Environment**: `Node`
   - **Build Command**: `cd mcp-server && npm install`
   - **Start Command**: `cd mcp-server && npm start`
   - **Plan**: Free (또는 원하는 플랜)

5. **환경 변수 설정**
   - **Environment Variables** 섹션에서 다음 변수 추가:
     | Key | Value |
     |-----|-------|
     | `NODE_ENV` | `production` |
     | `PORT` | `10000` (Render.com이 자동 설정하지만 명시적으로 설정 가능) |
     | `SUPABASE_URL` | Supabase 프로젝트 URL |
     | `SUPABASE_SERVICE_KEY` | Supabase Service Role Key |
     | `WEATHER_API_KEY` | OpenWeather API 키 |

6. **배포 시작**
   - **Create Web Service** 버튼 클릭
   - 배포 진행 상황 확인
   - 배포 완료 후 서비스 URL 확인

## 배포 후 확인

### 1. Health Check
```bash
curl https://your-app.onrender.com/health
```
예상 응답: `{"status":"ok"}`

### 2. 서비스 테스트
```bash
curl -X POST https://your-app.onrender.com/rpc/greet_store \
  -H "Content-Type: application/json" \
  -d '{"store_name": "테스트업체"}'
```

## 주의사항

### Free 플랜 제한사항
- **무료 플랜은 15분간 요청이 없으면 서비스가 자동으로 sleep 상태로 전환됩니다**
- 첫 요청 시 약 30초 정도의 cold start 시간이 소요될 수 있습니다
- 월 750시간의 무료 사용 시간 제공

### 해결 방법
- **Paid 플랜 사용**: 항상 실행 상태 유지
- **Uptime Monitoring 서비스 사용**: 주기적으로 health check 요청을 보내 서비스를 깨어있게 유지
- **Render Cron Jobs**: 주기적으로 health check 엔드포인트 호출

### 환경 변수 보안
- 환경 변수는 Render.com 대시보드에서만 설정
- 절대 코드에 직접 하드코딩하지 않기
- `.env` 파일은 Git에 커밋하지 않기 (`.gitignore`에 추가)

## 업데이트 배포

코드 변경 후 자동 배포:
- GitHub에 푸시하면 Render.com이 자동으로 감지하여 재배포
- 또는 Render.com 대시보드에서 **Manual Deploy** → **Deploy latest commit** 클릭

## 로그 확인

Render.com 대시보드에서:
- **Logs** 탭에서 실시간 로그 확인
- 배포 로그 및 런타임 로그 확인 가능
- 에러 발생 시 로그에서 원인 파악

## 트러블슈팅

### 배포 실패
- **Build Command 확인**: `cd mcp-server && npm install` 경로 확인
- **Start Command 확인**: `cd mcp-server && npm start` 경로 확인
- **환경 변수 확인**: 모든 필수 환경 변수가 설정되었는지 확인

### 서비스가 응답하지 않음
- **Health Check**: `/health` 엔드포인트로 서비스 상태 확인
- **로그 확인**: Render.com 대시보드의 Logs 탭에서 에러 확인
- **Free 플랜 Sleep**: 15분간 요청이 없으면 sleep 상태일 수 있음

### 환경 변수 오류
- **변수명 확인**: 대소문자 구분 확인
- **값 확인**: 따옴표 없이 값만 입력
- **재배포**: 환경 변수 변경 후 재배포 필요

## 추가 리소스

- [Render.com 공식 문서](https://render.com/docs)
- [Node.js 배포 가이드](https://render.com/docs/deploy-nodejs)
- [환경 변수 설정](https://render.com/docs/environment-variables)
