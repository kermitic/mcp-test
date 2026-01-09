# Claude Desktop MCP 서버 설정 가이드

이 문서는 Claude Desktop에서 HTTP/SSE transport를 사용하는 MCP 서버를 설정하는 방법을 설명합니다.

## 1. MCP 서버 실행

### 로컬에서 실행

1. MCP 서버 디렉토리로 이동:

```bash
cd mcp-server
```

2. 환경 변수 설정 (`.env` 파일):

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
WEATHER_API_KEY=your_weather_api_key
PORT=3000
```

3. 의존성 설치 및 서버 실행:

```bash
npm install
npm start
```

서버가 `http://localhost:3000`에서 실행됩니다.

### Render.com에 배포된 경우

배포된 서버 URL을 사용합니다 (예: `https://your-app.onrender.com`).

## 2. Claude Desktop 설정

### 설정 파일 위치

운영체제별 설정 파일 경로:

- **Windows**: `C:\Users\{사용자명}\AppData\Roaming\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

### 방법 1: mcp-remote 브리지 사용 (권장)

HTTP/SSE transport를 사용하는 MCP 서버는 `mcp-remote` 브리지를 통해 연결할 수 있습니다.

설정 파일에 다음을 추가:

```json
{
  "mcpServers": {
    "travel-store": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "http://localhost:3000/mcp"]
    }
  }
}
```

**배포된 서버를 사용하는 경우:**

```json
{
  "mcpServers": {
    "travel-store": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://your-app.onrender.com/mcp"]
    }
  }
}
```

### 방법 2: 직접 HTTP 연결 (Claude Desktop 최신 버전)

최신 Claude Desktop 버전에서는 HTTP transport를 직접 지원할 수 있습니다:

```json
{
  "mcpServers": {
    "travel-store": {
      "url": "http://localhost:3000/mcp",
      "transport": "http"
    }
  }
}
```

**참고**: 이 방법은 Claude Desktop 버전에 따라 지원되지 않을 수 있습니다. 지원되지 않는 경우 방법 1을 사용하세요.

## 3. 설정 적용

1. 설정 파일을 저장합니다.
2. Claude Desktop을 완전히 종료하고 다시 시작합니다.
3. Claude Desktop이 MCP 서버에 연결을 시도합니다.

## 4. 연결 확인

Claude Desktop을 시작한 후, 다음을 확인하세요:

1. **상태 확인**: Claude Desktop의 설정 메뉴에서 MCP 서버 연결 상태를 확인할 수 있습니다.
2. **로그 확인**: 문제가 있는 경우 Claude Desktop의 로그를 확인하세요.

## 5. 채팅창에서 테스트하기

### 기본 테스트

MCP 서버가 정상적으로 연결되면, Claude Desktop의 채팅창에서 다음과 같이 테스트할 수 있습니다:

```
사용 가능한 MCP 도구를 알려줘
```

또는:

```
greet_store 도구를 사용해서 "테스트업체"라는 이름의 업체 정보를 조회해줘
```

### 실제 사용 예시

**예시 1: 업체 환영 인사 및 날씨 정보 조회**

```
"서울카페"라는 업체의 환영 인사와 날씨 정보를 알려줘
```

**예시 2: 여러 업체 정보 조회**

```
"강남식당"과 "홍대카페" 두 업체의 정보를 각각 조회해서 비교해줘
```

**예시 3: 도구 직접 호출**

```
greet_store 도구를 사용해서 store_name이 "맛있는집"인 업체의 정보를 가져와줘
```

### 예상 응답 형식

Claude가 MCP 도구를 성공적으로 호출하면 다음과 같은 형식으로 응답합니다:

```
"서울카페" 업체 정보:

- 환영 인사: "안녕하세요! 서울카페에 오신 것을 환영합니다."
- 날씨 정보: "서울카페(서울시 강남구)는 지금 현재 맑음, 22°C"
```

## 6. 문제 해결

### 연결 실패 시

1. **서버가 실행 중인지 확인**:

   ```bash
   curl http://localhost:3000/health
   ```

   또는 브라우저에서 `http://localhost:3000/health` 접속

2. **포트 충돌 확인**: 다른 애플리케이션이 3000번 포트를 사용하고 있는지 확인

3. **방화벽 확인**: 로컬 서버의 경우 방화벽이 포트를 차단하지 않는지 확인

4. **로그 확인**:
   - MCP 서버 로그 확인
   - Claude Desktop 로그 확인

### 도구가 보이지 않는 경우

1. Claude Desktop을 재시작해보세요.
2. 설정 파일의 JSON 구문이 올바른지 확인하세요.
3. MCP 서버가 정상적으로 실행 중인지 확인하세요.

### mcp-remote 설치 오류

`mcp-remote`가 설치되지 않는 경우:

```bash
npm install -g mcp-remote
```

그리고 설정 파일에서 `npx` 대신 직접 경로를 사용:

```json
{
  "mcpServers": {
    "travel-store": {
      "command": "mcp-remote",
      "args": ["http://localhost:3000/mcp"]
    }
  }
}
```

## 7. 고급 설정

### 환경 변수 전달

로컬 서버에 환경 변수를 전달해야 하는 경우, `mcp-remote`를 사용하는 대신 직접 Node.js 스크립트를 실행할 수 있습니다:

```json
{
  "mcpServers": {
    "travel-store": {
      "command": "node",
      "args": ["path/to/mcp-server/index.js"],
      "env": {
        "SUPABASE_URL": "your_url",
        "SUPABASE_SERVICE_KEY": "your_key",
        "WEATHER_API_KEY": "your_key"
      }
    }
  }
}
```

하지만 이 방법은 stdio transport를 사용하므로, 현재 구현된 HTTP/SSE transport와는 호환되지 않습니다. HTTP/SSE transport를 사용하려면 방법 1(mcp-remote)을 사용해야 합니다.

## 참고 자료

- [MCP 공식 문서](https://modelcontextprotocol.io)
- [Claude Desktop 설정 가이드](https://claude.ai/docs/mcp)
