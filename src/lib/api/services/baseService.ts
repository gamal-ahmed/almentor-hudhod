
import { supabase } from '@/integrations/supabase/client';
import { API_ENDPOINTS, SUPABASE_KEY } from '../utils';
import { useLogsStore } from '@/lib/useLogsStore';

export const getLogsStore = () => useLogsStore.getState();

const apiEndpoints = API_ENDPOINTS;

// Create a service for base Supabase access
export const baseService = {
  supabase,
  supabaseKey: SUPABASE_KEY,
  apiEndpoints,
  
  // Helper to create authenticated requests
  async createAuthorizedRequest(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    // Get current auth session
    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;
    
    // Make sure headers exist
    if (!options.headers) {
      options.headers = {};
    }
    
    // Add auth headers
    const headers = new Headers(options.headers as HeadersInit);
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    } else {
      // Fallback to anon key if not authenticated
      headers.set('apikey', SUPABASE_KEY);
      headers.set('Authorization', `Bearer ${SUPABASE_KEY}`);
    }
    
    // Create the request with headers
    const request = new Request(url, {
      ...options,
      headers
    });
    
    return fetch(request);
  }
};
