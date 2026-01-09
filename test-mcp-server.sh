#!/bin/bash
# MCP 서버 테스트 스크립트 (Bash)

NGROK_URL="${1:-https://545c0359297a.ngrok-free.app}"
STORE_NAME="${2:-테스트업체}"

echo "🧪 MCP 서버 테스트 시작"
echo ""
echo "📍 서버 URL: $NGROK_URL"
echo "🏪 테스트 업체명: $STORE_NAME"
echo ""

# 1. Health Check
echo "1️⃣ Health Check 테스트..."
HEALTH_RESPONSE=$(curl -s "$NGROK_URL/health")
if [ $? -eq 0 ]; then
  echo "✅ Health Check 성공: $HEALTH_RESPONSE"
else
  echo "❌ Health Check 실패"
  exit 1
fi

echo ""

# 2. greet_store 엔드포인트 테스트
echo "2️⃣ greet_store 엔드포인트 테스트..."
RESPONSE=$(curl -s -X POST "$NGROK_URL/rpc/greet_store" \
  -H "Content-Type: application/json" \
  -d "{\"store_name\": \"$STORE_NAME\"}")

if [ $? -eq 0 ]; then
  echo "✅ 요청 성공!"
  echo ""
  echo "📋 응답 데이터:"
  echo "$RESPONSE" | jq .
  
  if command -v jq &> /dev/null; then
    echo ""
    echo "📝 응답 내용:"
    echo "   환영 인사: $(echo "$RESPONSE" | jq -r '.greeting')"
    echo "   날씨 정보: $(echo "$RESPONSE" | jq -r '.weather_summary')"
  fi
else
  echo "❌ 요청 실패"
  exit 1
fi
