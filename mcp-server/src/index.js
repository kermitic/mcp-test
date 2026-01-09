import Fastify from 'fastify';
import { randomUUID } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  isInitializeRequest,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import * as z from 'zod';

import { config } from './config/config.js';
import { logger } from './utils/logger.js';
import { initDatabase } from './database/db.js';
import { greetStoreHandler } from './handlers/greetStore.js';

const fastify = Fastify({
  logger: true,
});

// 세션별 transport 저장
const transports = {};

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
        logger.info(`MCP Session initialized: ${id}`);
      },
      onsessionclosed: (id) => {
        delete transports[id];
        logger.info(`MCP Session closed: ${id}`);
      },
    });

    transport.onclose = () => {
      if (transport.sessionId) {
        delete transports[transport.sessionId];
      }
    };

    const server = new McpServer({
      name: config.mcp.name,
      version: config.mcp.version,
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
      async (params) => {
        return await greetStoreHandler(params);
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
    logger.error('Error handling MCP request:', error);

    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');

      // MCP 프로토콜에 맞는 에러 응답
      const errorMessage =
        error instanceof McpError ? error.message : 'Internal error';

      const errorCode = error instanceof McpError ? error.code : -32603; // Internal error code

      res.end(
        JSON.stringify({
          jsonrpc: '2.0',
          error: {
            code: errorCode,
            message: errorMessage,
          },
          id: request.body?.id || null,
        })
      );
    } else {
      logger.error('Response already sent, cannot send error response');
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

// 전역 에러 핸들러
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise);
  logger.error('Reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // 치명적인 에러이므로 서버 종료
  fastify.log.error(error);
  process.exit(1);
});

const start = async () => {
  try {
    // 데이터베이스 초기화
    initDatabase();

    const port = config.server.port;
    await fastify.listen({ port, host: config.server.host });
    logger.info(`MCP Server running on port ${port}`);
    logger.info(`MCP endpoint: http://${config.server.host}:${port}/mcp`);
  } catch (err) {
    logger.error('Failed to start server:', err);
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
