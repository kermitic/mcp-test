import { findSimilarStore } from '../services/storeService.js';
import { getWeatherSummary } from '../services/weatherService.js';
import {
  InvalidStoreNameError,
  InternalServerError,
  StoreNotFoundError,
  DatabaseError,
} from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export async function greetStoreHandler({ store_name }) {
  // 입력값 검증
  if (!store_name || typeof store_name !== 'string') {
    logger.error('Invalid store_name input:', store_name);
    throw new InvalidStoreNameError();
  }

  const trimmedName = store_name.trim();
  if (trimmedName === '') {
    logger.error('Empty store_name after trim');
    throw new InvalidStoreNameError();
  }

  try {
    // 업체 검색
    const matchedStore = await findSimilarStore(trimmedName);

    // 날씨 정보 조회
    let weatherSummary = '날씨 정보 없음';
    if (matchedStore.lat && matchedStore.lng) {
      try {
        weatherSummary = await getWeatherSummary(
          matchedStore.lat,
          matchedStore.lng
        );
      } catch (weatherError) {
        logger.error('Weather API error (non-fatal):', weatherError);
        // 날씨 정보 실패는 치명적이지 않으므로 계속 진행
        weatherSummary = '날씨 정보를 가져올 수 없습니다';
      }
    } else {
      logger.debug(`No coordinates for store: "${matchedStore.name}"`);
    }

    const result = {
      greeting: `어서오세요! ${matchedStore.name} 인사올립니다!`,
      weather_summary: `${matchedStore.name}(${
        matchedStore.address || '주소 없음'
      })는 지금 현재 ${weatherSummary}`,
      matched_name: matchedStore.name,
      similarity_score: matchedStore.score,
    };

    logger.info(`Successfully processed request for: "${trimmedName}"`);

    return {
      content: [{ type: 'text', text: JSON.stringify(result) }],
      structuredContent: result,
    };
  } catch (error) {
    // 이미 커스텀 에러인 경우 그대로 throw
    if (
      error instanceof InvalidStoreNameError ||
      error instanceof StoreNotFoundError ||
      error instanceof DatabaseError
    ) {
      logger.error(`Error in greetStoreHandler:`, error.message);
      throw error;
    }

    // 예상치 못한 에러 처리
    logger.error('Unexpected error in greetStoreHandler:', error);
    throw new InternalServerError(error.message || '알 수 없는 오류', error);
  }
}
