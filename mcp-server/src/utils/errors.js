import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

export class StoreNotFoundError extends McpError {
  constructor(storeName, threshold) {
    super(
      ErrorCode.InvalidRequest,
      `'${storeName}'와 유사한 업체를 찾을 수 없습니다. (유사도 임계값: ${threshold} 이상)`
    );
  }
}

export class InvalidStoreNameError extends McpError {
  constructor() {
    super(ErrorCode.InvalidRequest, '업체명을 입력해주세요');
  }
}

export class DatabaseError extends McpError {
  constructor(message, originalError) {
    super(
      ErrorCode.InternalError,
      `데이터베이스 조회 중 오류가 발생했습니다: ${
        message || '알 수 없는 오류'
      }`
    );
    this.originalError = originalError;
  }
}

export class WeatherServiceError extends McpError {
  constructor(message) {
    super(
      ErrorCode.InternalError,
      `날씨 정보를 가져올 수 없습니다: ${message}`
    );
  }
}

export class InternalServerError extends McpError {
  constructor(message, originalError) {
    super(
      ErrorCode.InternalError,
      `업체 조회 중 오류가 발생했습니다: ${message || '알 수 없는 오류'}`
    );
    this.originalError = originalError;
  }
}
