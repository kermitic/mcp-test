import { createClient } from '@supabase/supabase-js';
import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';

let supabaseClient = null;

export function initDatabase() {
  if (!config.supabase.url || !config.supabase.serviceKey) {
    throw new Error('Supabase URL and Service Key must be provided');
  }

  supabaseClient = createClient(
    config.supabase.url,
    config.supabase.serviceKey
  );

  logger.info('Database (Supabase) initialized');
  return supabaseClient;
}

export function getSupabaseClient() {
  if (!supabaseClient) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return supabaseClient;
}
