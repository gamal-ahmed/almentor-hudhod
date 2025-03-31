
import { supabase } from '@/integrations/supabase/client';
import { CloudStorageAccount, CloudStorageFile, CloudStorageProvider } from '@/types/cloudStorage';
import { API_ENDPOINTS } from './utils';

// Type guard to verify CloudStorageAccount type
const isCloudStorageAccount = (data: any): data is CloudStorageAccount => {
  return data && 
    typeof data.id === 'string' && 
    typeof data.provider === 'string' &&
    (data.provider === 'google-drive' || data.provider === 'dropbox');
};

// Main interface for cloud storage operations
export const cloudStorageService = {
  // OAuth authentication
  getAuthUrl: async (provider: CloudStorageProvider, redirectUrl: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.CLOUD_STORAGE_AUTH}?provider=${provider}&redirectUrl=${encodeURIComponent(redirectUrl)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get auth URL: ${response.statusText}`);
      }

      const data = await response.json();
      return data.authUrl;
    } catch (error) {
      console.error('Error getting auth URL:', error);
      throw error;
    }
  },

  // Handle OAuth callback and save account
  handleOAuthCallback: async (provider: CloudStorageProvider, code: string, redirectUrl: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.CLOUD_STORAGE_TOKEN}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ provider, code, redirectUrl })
      });

      if (!response.ok) {
        throw new Error(`Failed to exchange token: ${response.statusText}`);
      }

      const data = await response.json();
      return data.account;
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      throw error;
    }
  },

  // Get connected accounts for the current user
  getConnectedAccounts: async (): Promise<CloudStorageAccount[]> => {
    try {
      const { data, error } = await supabase
        .from('cloud_storage_accounts')
        .select('*');

      if (error) throw error;
      
      // Transform the raw data to match CloudStorageAccount type
      const accounts: CloudStorageAccount[] = (data || []).map(account => ({
        id: account.id,
        provider: account.provider as CloudStorageProvider,
        userId: account.user_id,
        email: account.email,
        name: account.name || '',
        accessToken: account.access_token,
        refreshToken: account.refresh_token,
        expiresAt: account.expires_at,
        createdAt: account.created_at,
        lastUsed: account.last_used
      }));
      
      return accounts;
    } catch (error) {
      console.error('Error getting connected accounts:', error);
      throw error;
    }
  },

  // List files in a folder
  listFiles: async (
    provider: CloudStorageProvider,
    accountId: string,
    folderId?: string
  ): Promise<CloudStorageFile[]> => {
    try {
      const response = await fetch(`${API_ENDPOINTS.CLOUD_STORAGE_FILES}?provider=${provider}&accountId=${accountId}${folderId ? `&folderId=${folderId}` : ''}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to list files: ${response.statusText}`);
      }

      const data = await response.json();
      return data.files;
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  },

  // Download file
  downloadFile: async (
    provider: CloudStorageProvider,
    accountId: string,
    fileId: string
  ): Promise<Blob> => {
    try {
      const response = await fetch(`${API_ENDPOINTS.CLOUD_STORAGE_DOWNLOAD}?provider=${provider}&accountId=${accountId}&fileId=${fileId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  },

  // Disconnect account
  disconnectAccount: async (accountId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('cloud_storage_accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;
    } catch (error) {
      console.error('Error disconnecting account:', error);
      throw error;
    }
  }
};
