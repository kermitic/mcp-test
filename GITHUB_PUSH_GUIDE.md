# GitHub 푸시 가이드

이 문서는 프로젝트를 GitHub에 푸시하는 전체 절차를 설명합니다.

## 사전 준비

1. **GitHub 계정 준비**
   - [GitHub](https://github.com) 계정이 있어야 합니다
   - 없다면 계정 생성

2. **Git 설치 확인**
   ```bash
   git --version
   ```
   - 설치되어 있지 않다면 [Git 공식 사이트](https://git-scm.com/downloads)에서 다운로드

## 절차

### 1단계: GitHub에서 새 저장소 생성

1. **GitHub 웹사이트 접속**
   - [GitHub.com](https://github.com) 로그인

2. **새 저장소 생성**
   - 우측 상단 **+** 버튼 클릭 → **New repository** 선택
   - 또는 [새 저장소 생성 페이지](https://github.com/new)로 이동

3. **저장소 설정**
   - **Repository name**: `mcp-test` (또는 원하는 이름)
   - **Description**: (선택사항) "MCP Store Greeting 서버"
   - **Visibility**: 
     - **Public**: 누구나 볼 수 있음 (무료)
     - **Private**: 본인만 볼 수 있음 (유료 플랜 필요)
   - **Initialize this repository with**: 체크하지 않기 (README, .gitignore, license 모두 체크 해제)
   - **Create repository** 클릭

4. **저장소 URL 확인**
   - 생성 후 나타나는 페이지에서 저장소 URL 복사
   - 예: `https://github.com/your-username/mcp-test.git`

### 2단계: 로컬에서 Git 저장소 초기화

프로젝트 폴더에서 다음 명령어 실행:

```bash
# 프로젝트 폴더로 이동
cd D:\projects\12_Travel\mcp-test

# Git 저장소 초기화
git init

# 현재 상태 확인
git status
```

### 3단계: 파일 추가 및 커밋

```bash
# 모든 파일 추가 (단, .gitignore에 있는 파일은 제외됨)
git add .

# 커밋 메시지와 함께 커밋
git commit -m "Initial commit: MCP server with Render.com deployment"
```

**참고**: `.gitignore` 파일에 의해 다음 파일들은 자동으로 제외됩니다:
- `node_modules/` 폴더
- `.env` 파일 (환경 변수)
- `dist/`, `build/` 폴더
- 로그 파일들

### 4단계: GitHub 원격 저장소 연결

```bash
# 원격 저장소 추가 (your-username과 repository-name을 실제 값으로 변경)
git remote add origin https://github.com/your-username/mcp-test.git

# 원격 저장소 확인
git remote -v
```

**예시**:
```bash
git remote add origin https://github.com/johndoe/mcp-test.git
```

### 5단계: GitHub에 푸시

```bash
# 기본 브랜치를 main으로 설정 (GitHub 기본 브랜치)
git branch -M main

# GitHub에 푸시
git push -u origin main
```

**인증 방법**:
- **Personal Access Token 사용** (권장):
  1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
  2. **Generate new token (classic)** 클릭
  3. **Note**: "mcp-test-push" (설명)
  4. **Expiration**: 원하는 기간 선택
  5. **Select scopes**: `repo` 체크
  6. **Generate token** 클릭
  7. 생성된 토큰 복사 (한 번만 보여짐!)
  8. 푸시 시 비밀번호 대신 이 토큰 입력

- **GitHub CLI 사용**:
  ```bash
  gh auth login
  git push -u origin main
  ```

### 6단계: 확인

1. **GitHub 웹사이트에서 확인**
   - 저장소 페이지 새로고침
   - 모든 파일이 업로드되었는지 확인

2. **로컬에서 확인**
   ```bash
   git log
   git status
   ```

## 전체 명령어 요약

```bash
# 1. Git 초기화
git init

# 2. 파일 추가
git add .

# 3. 커밋
git commit -m "Initial commit: MCP server with Render.com deployment"

# 4. 원격 저장소 연결 (URL은 실제 GitHub 저장소 URL로 변경)
git remote add origin https://github.com/your-username/mcp-test.git

# 5. 브랜치 이름 설정
git branch -M main

# 6. 푸시
git push -u origin main
```

## 이후 업데이트 방법

코드를 수정한 후:

```bash
# 변경사항 확인
git status

# 변경된 파일 추가
git add .

# 커밋
git commit -m "설명 메시지"

# 푸시
git push
```

## 주의사항

### 환경 변수 파일 (.env)
- `.env` 파일은 `.gitignore`에 포함되어 있어 자동으로 제외됩니다
- **절대 `.env` 파일을 커밋하지 마세요!**
- Render.com에서는 대시보드에서 환경 변수를 직접 설정합니다

### node_modules
- `node_modules/` 폴더도 자동으로 제외됩니다
- Render.com에서 `npm install`로 자동 설치됩니다

### Personal Access Token 보안
- 토큰을 절대 코드나 공개 장소에 공유하지 마세요
- 토큰이 노출되면 즉시 GitHub에서 삭제하고 새로 생성하세요

## 문제 해결

### "fatal: not a git repository"
```bash
git init
```

### "remote origin already exists"
```bash
# 기존 원격 저장소 제거 후 다시 추가
git remote remove origin
git remote add origin https://github.com/your-username/mcp-test.git
```

### "Authentication failed"
- Personal Access Token을 올바르게 입력했는지 확인
- 토큰에 `repo` 권한이 있는지 확인
- 토큰이 만료되지 않았는지 확인

### "Permission denied"
- 저장소가 Private인 경우, 본인 계정으로 로그인했는지 확인
- 저장소 소유권 확인

## 다음 단계

GitHub에 푸시가 완료되면:

1. **Render.com 배포**
   - `RENDER_DEPLOYMENT.md` 파일 참조
   - Render.com에서 GitHub 저장소 연결
   - 환경 변수 설정
   - 배포 시작

2. **테스트**
   - 배포된 서버 URL로 테스트
   - `README.md`의 테스트 방법 참조
