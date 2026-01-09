import dotenv from 'dotenv';

dotenv.config();

export const config = {
  server: {
    port: process.env.PORT || 3000,
    host: '0.0.0.0',
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    serviceKey: process.env.SUPABASE_SERVICE_KEY,
  },
  weather: {
    apiKey: process.env.WEATHER_API_KEY,
    baseUrl: 'https://api.openweathermap.org/data/2.5/weather',
    units: 'metric',
    lang: 'kr',
  },
  store: {
    similarityThreshold: 0.3,
  },
  mcp: {
    name: 'travel-store-server',
    version: '1.0.0',
  },
};
