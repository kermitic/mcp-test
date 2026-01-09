import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';
import { WeatherServiceError } from '../utils/errors.js';

export async function getWeatherSummary(lat, lng) {
  const apiKey = config.weather.apiKey;

  if (!apiKey) {
    logger.warn('WEATHER_API_KEY is not set');
    return '날씨 정보를 가져올 수 없습니다 (API 키 없음)';
  }

  const apiUrl = `${config.weather.baseUrl}?lat=${lat}&lon=${lng}&appid=${apiKey}&units=${config.weather.units}&lang=${config.weather.lang}`;

  try {
    logger.debug(`Fetching weather for coordinates: ${lat}, ${lng}`);
    const response = await fetch(apiUrl);

    if (!response.ok) {
      logger.error(
        `Weather API HTTP error: ${response.status} ${response.statusText}`
      );
      return `날씨 정보를 가져올 수 없습니다 (HTTP ${response.status})`;
    }

    const data = await response.json();

    if (data.cod !== 200) {
      logger.error(
        `Weather API error code: ${data.cod}, message: ${
          data.message || 'Unknown'
        }`
      );
      return '날씨 정보를 가져올 수 없습니다';
    }

    const weather = data.weather?.[0];
    const temp = data.main?.temp;

    if (!weather || temp === undefined) {
      logger.error('Invalid weather data structure:', data);
      return '날씨 정보를 가져올 수 없습니다';
    }

    const description = weather.description;
    const roundedTemp = Math.round(temp);

    logger.info(
      `Weather fetched successfully: ${description}, ${roundedTemp}°C`
    );
    return `현재 ${description}, ${roundedTemp}°C`;
  } catch (error) {
    logger.error('Weather API error:', error);
    return '날씨 정보를 가져올 수 없습니다';
  }
}
