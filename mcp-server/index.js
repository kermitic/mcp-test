import Fastify from 'fastify';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const fastify = Fastify({
  logger: true
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

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

// MCP Tool: greet_store
fastify.post('/rpc/greet_store', async (request, reply) => {
  const { store_name } = request.body;
  
  if (!store_name) {
    return reply.code(400).send({
      error: 'store_name is required'
    });
  }
  
  try {
    // Supabase에서 업체 정보 조회
    const { data: store, error } = await supabase
      .from('stores')
      .select('greeting_message, lat, lng, address_text')
      .eq('store_name', store_name)
      .single();
    
    if (error || !store) {
      return reply.code(404).send({
        error: 'Store not found'
      });
    }
    
    // 날씨 정보 조회
    let weatherSummary = '날씨 정보 없음';
    if (store.lat && store.lng) {
      weatherSummary = await getWeatherSummary(store.lat, store.lng);
    }
    
    // 정규화된 JSON 반환
    return {
      greeting: store.greeting_message,
      weather_summary: `${store_name}(${store.address_text})는 지금 ${weatherSummary}`
    };
  } catch (error) {
    console.error('Error:', error);
    return reply.code(500).send({
      error: 'Internal server error'
    });
  }
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
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
