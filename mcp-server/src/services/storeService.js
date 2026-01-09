import { getSupabaseClient } from '../database/db.js';
import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';
import { DatabaseError, StoreNotFoundError } from '../utils/errors.js';

export async function findSimilarStore(storeName) {
  const trimmedName = storeName.trim();

  if (!trimmedName) {
    throw new Error('Store name cannot be empty');
  }

  logger.debug(`Searching for store: "${trimmedName}"`);

  try {
    const supabase = getSupabaseClient();

    // pg_trgm의 similarity 함수를 사용한 유사도 검색
    const { data: stores, error } = await supabase.rpc(
      'search_similar_store',
      {
        search_name: trimmedName,
        similarity_threshold: config.store.similarityThreshold,
      }
    );

    // Supabase RPC 에러 처리
    if (error) {
      logger.error('RPC function error:', error);
      logger.error('Error details:', JSON.stringify(error, null, 2));
      throw new DatabaseError(
        error.message || '알 수 없는 오류',
        error
      );
    }

    // 검색 결과 없음 처리
    if (!stores || stores.length === 0) {
      logger.info(`No match found for: "${trimmedName}"`);
      throw new StoreNotFoundError(
        trimmedName,
        config.store.similarityThreshold
      );
    }

    // 가장 유사한 업체 선택 (이미 RPC 함수에서 정렬되어 있음)
    const matchedStore = stores[0];
    const similarityScore = matchedStore.score;
    const actualName = matchedStore.store_name;

    logger.info(
      `Matched: "${trimmedName}" -> "${actualName}" (score: ${similarityScore.toFixed(3)})`
    );

    return {
      name: actualName,
      address: matchedStore.address_text || null,
      lat: matchedStore.lat || null,
      lng: matchedStore.lng || null,
      score: similarityScore,
    };
  } catch (error) {
    // 커스텀 에러는 그대로 전파
    if (error instanceof DatabaseError || error instanceof StoreNotFoundError) {
      throw error;
    }

    // 예상치 못한 에러
    logger.error('Unexpected error in findSimilarStore:', error);
    throw new DatabaseError(error.message || '알 수 없는 오류', error);
  }
}
