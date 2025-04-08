
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
  },
  
  // Add the missing createAuthorizedRequest method
  createAuthorizedRequest: async (url: string, options: RequestInit = {}) => {
    // Get auth session from Supabase if available
    const { data: authData } = await baseService.supabase.auth.getSession();
    const authToken = authData.session?.access_token || baseService.supabaseKey;
    
    // Merge provided options with default headers
    const requestOptions: RequestInit = {
      ...options,
      headers: {
        ...baseService.headers,
        'Authorization': `Bearer ${authToken}`,
        ...options.headers
      }
    };
    
    return fetch(url, requestOptions);
  }
};
