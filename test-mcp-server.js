// MCP 서버 테스트 스크립트
// 사용법: node test-mcp-server.js <ngrok-url> <store-name>

const ngrokUrl = process.argv[2] || 'https://545c0359297a.ngrok-free.app';
const storeName = process.argv[3] || '테스트업체';

async function testMCP() {
  console.log('🧪 MCP 서버 테스트 시작\n');
  console.log(`📍 서버 URL: ${ngrokUrl}`);
  console.log(`🏪 테스트 업체명: ${storeName}\n`);

  // 1. Health Check
  console.log('1️⃣ Health Check 테스트...');
  try {
    const healthResponse = await fetch(`${ngrokUrl}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health Check 성공:', healthData);
  } catch (error) {
    console.error('❌ Health Check 실패:', error.message);
    return;
  }

  console.log('');

  // 2. greet_store 엔드포인트 테스트
  console.log('2️⃣ greet_store 엔드포인트 테스트...');
  try {
    const response = await fetch(`${ngrokUrl}/rpc/greet_store`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        store_name: storeName,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ 요청 실패:', response.status, data);
      return;
    }

    console.log('✅ 요청 성공!');
    console.log('\n📋 응답 데이터:');
    console.log(JSON.stringify(data, null, 2));
    console.log('\n📝 응답 내용:');
    console.log(`   환영 인사: ${data.greeting}`);
    console.log(`   날씨 정보: ${data.weather_summary}`);
  } catch (error) {
    console.error('❌ 요청 실패:', error.message);
    if (error.cause) {
      console.error('   원인:', error.cause);
    }
  }
}

testMCP();
