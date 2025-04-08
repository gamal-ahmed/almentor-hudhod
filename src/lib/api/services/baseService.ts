
import { createClient } from '@supabase/supabase-js';
import { API_ENDPOINTS, SUPABASE_KEY } from '../utils';
import { useLogsStore } from '@/lib/useLogsStore';

// Create an adapter to access the logs store from outside of React components
export const getLogsStore = () => {
  return useLogsStore.getState();
};

// API gateway service
export const baseService = {
  supabase: createClient('https://xbwnjfdzbnyvaxmqufrw.supabase.co', SUPABASE_KEY),
  supabaseKey: SUPABASE_KEY,
  apiEndpoints: API_ENDPOINTS,
  
  headers: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`
  }
};
