import Fastify from 'fastify';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { randomUUID } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import * as z from 'zod';

dotenv.config();

const fastify = Fastify({
  logger: true,
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// 세션별 transport 저장
const transports = {};

// 날씨 API 호출 함수
async function getWeatherSummary(lat, lng) {
  const apiKey = process.env.WEATHER_API_KEY;
  const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric&lang=kr`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.cod !== 200) {
      return `날씨 정보를 가져올 수 없습니다.`;
    }

    const weather = data.weather[0];
    const temp = Math.round(data.main.temp);
    const description = weather.description;

    return `현재 ${description}, ${temp}°C`;
  } catch (error) {
    console.error('Weather API error:', error);
    return `날씨 정보를 가져올 수 없습니다.`;
  }
}

// MCP 엔드포인트 처리 함수
async function handleMcpRequest(request, reply) {
  // Fastify가 자동으로 응답을 보내지 않도록 먼저 hijack
  await reply.hijack();

  const sessionId = request.headers['mcp-session-id'];
  let transport = sessionId ? transports[sessionId] : null;

  // Fastify의 원시 request/response 객체 사용
  const req = request.raw;
  const res = reply.raw;

  // 요청 본문 파싱 (이미 Fastify가 파싱했지만 원시 객체에 추가)
  if (request.body && !req.body) {
    req.body = request.body;
  }

  // 세션이 없고 초기화 요청인 경우 새 세션 생성
  if (!transport && isInitializeRequest(request.body)) {
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (id) => {
        transports[id] = transport;
        console.log('MCP Session initialized:', id);
      },
      onsessionclosed: (id) => {
        delete transports[id];
        console.log('MCP Session closed:', id);
      },
    });

    transport.onclose = () => {
      if (transport.sessionId) {
        delete transports[transport.sessionId];
      }
    };

    const server = new McpServer({
      name: 'travel-store-server',
      version: '1.0.0',
    });

    // greet_store 도구 등록
    server.registerTool(
      'greet_store',
      {
        title: '업체 환영 인사 및 날씨 정보',
        description: '업체명을 입력받아 환영 인사와 날씨 정보를 반환합니다.',
        inputSchema: {
          store_name: z.string().describe('조회할 업체명'),
        },
        outputSchema: {
          greeting: z.string().describe('업체의 환영 인사 문구'),
          weather_summary: z.string().describe('업체 위치 기준 현재 날씨 요약'),
          matched_name: z.string().describe('매칭된 실제 업체명'),
          similarity_score: z.number().describe('유사도 점수 (0.0 ~ 1.0)'),
        },
      },
      async ({ store_name }) => {
        if (!store_name) {
          throw new Error('store_name is required');
        }

        try {
          // pg_trgm의 similarity 함수를 사용한 유사도 검색
          // RPC 함수를 통해 PostgreSQL의 similarity 함수 호출
          const { data: stores, error } = await supabase.rpc(
            'search_similar_store',
            {
              search_name: store_name,
              similarity_threshold: 0.3,
            }
          );

          if (error) {
            console.error('RPC function error:', error);
            throw new Error(`Failed to search store: ${error.message}`);
          }

          if (!stores || stores.length === 0) {
            throw new Error(
              `Store not found: ${store_name}. No similar store found with similarity > 0.3`
            );
          }

          // 가장 유사한 업체 선택 (이미 RPC 함수에서 정렬되어 있음)
          const matchedStore = stores[0];
          const similarityScore = matchedStore.score;

          // 날씨 정보 조회
          let weatherSummary = '날씨 정보 없음';
          if (matchedStore.lat && matchedStore.lng) {
            weatherSummary = await getWeatherSummary(
              matchedStore.lat,
              matchedStore.lng
            );
          }

          const result = {
            greeting: `어서오세요! ${matchedStore.store_name} 인사올립니다!`,
            weather_summary: `${matchedStore.store_name}(${matchedStore.address_text})는 지금 현재 ${weatherSummary}`,
            matched_name: matchedStore.store_name,
            similarity_score: similarityScore,
          };

          return {
            content: [{ type: 'text', text: JSON.stringify(result) }],
            structuredContent: result,
          };
        } catch (error) {
          console.error('Error in greet_store:', error);
          throw error;
        }
      }
    );

    await server.connect(transport);
  } else if (!transport) {
    // 유효하지 않은 세션
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        jsonrpc: '2.0',
        error: { code: -32000, message: 'Invalid session' },
        id: null,
      })
    );
    return;
  }

  // 요청 처리
  try {
    await transport.handleRequest(req, res, request.body);
  } catch (error) {
    console.error('Error handling MCP request:', error);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal error' },
          id: request.body?.id || null,
        })
      );
    }
  }
}

// MCP 엔드포인트: POST, GET, DELETE
fastify.post('/mcp', async (request, reply) => {
  await handleMcpRequest(request, reply);
});

fastify.get('/mcp', async (request, reply) => {
  await handleMcpRequest(request, reply);
});

fastify.delete('/mcp', async (request, reply) => {
  await handleMcpRequest(request, reply);
});

// Health check
fastify.get('/health', async (request, reply) => {
  return { status: 'ok' };
});

const start = async () => {
  try {
    const port = process.env.PORT || 3000;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`MCP Server running on port ${port}`);
    console.log(`MCP endpoint: http://0.0.0.0:${port}/mcp`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
