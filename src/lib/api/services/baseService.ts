
import { useLogsStore } from "@/lib/useLogsStore";
import { API_ENDPOINTS, SUPABASE_KEY } from "../utils";
import { supabase } from "@/integrations/supabase/client";

// Access logs store outside of component
export const getLogsStore = () => useLogsStore.getState();

// Base service with common methods
export const baseService = {
  supabase,
  apiEndpoints: API_ENDPOINTS,
  supabaseKey: SUPABASE_KEY,
  
  // Helper to create fetch requests with authorization
  createAuthorizedRequest: (url: string, options: RequestInit = {}) => {
    const headers = {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      ...options.headers
    };
    
    return fetch(url, {
      ...options,
      headers
    });
  }
};
