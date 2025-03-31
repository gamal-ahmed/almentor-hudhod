
import { supabase } from "@/integrations/supabase/client";
import { API_ENDPOINTS } from "./utils";
import { CloudStorageAccount, CloudStorageFile, CloudStorageProvider } from "@/types/cloudStorage";
import { handleApiError } from "./utils";

/**
 * Cloud Storage Service
 * Handles OAuth flow and file operations for cloud storage providers
 */
export const cloudStorageService = {
  /**
   * Get the authentication URL for a cloud storage provider
   */
  async getAuthUrl(provider: CloudStorageProvider, redirectUrl: string): Promise<string> {
    try {
      // Get the authorization token for the authenticated user
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token;
      
      if (!authToken) {
        throw new Error('User must be authenticated to connect cloud storage');
      }
      
      const response = await fetch(`${API_ENDPOINTS.CLOUD_STORAGE_AUTH}?provider=${provider}&redirectUrl=${encodeURIComponent(redirectUrl)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get auth URL: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      return data.authUrl;
    } catch (error) {
      console.error('Error getting auth URL:', error);
      throw error;
    }
  },
  
  /**
   * Exchange an OAuth code for tokens and store the connection
   */
  async exchangeCodeForToken(provider: CloudStorageProvider, code: string, redirectUrl: string): Promise<CloudStorageAccount> {
    try {
      // Get the authorization token for the authenticated user
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token;
      
      if (!authToken) {
        throw new Error('User must be authenticated to connect cloud storage');
      }
      
      const response = await fetch(`${API_ENDPOINTS.CLOUD_STORAGE_TOKEN}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider, code, redirectUrl }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to exchange code: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      return data.account;
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      throw error;
    }
  },
  
  /**
   * Get a list of connected cloud storage accounts for the current user
   */
  async getConnectedAccounts(): Promise<CloudStorageAccount[]> {
    try {
      const { data, error } = await supabase
        .from('cloud_storage_accounts')
        .select('*');
      
      if (error) {
        throw error;
      }
      
      // Map the Supabase data to our CloudStorageAccount type
      const accounts: CloudStorageAccount[] = data.map((account: any) => ({
        id: account.id,
        provider: account.provider as CloudStorageProvider,
        userId: account.user_id,
        email: account.email,
        name: account.name,
        accessToken: account.access_token,
        refreshToken: account.refresh_token,
        expiresAt: account.expires_at,
        createdAt: account.created_at,
        lastUsed: account.last_used,
      }));
      
      return accounts;
    } catch (error) {
      console.error('Error getting cloud storage accounts:', error);
      throw error;
    }
  },
  
  /**
   * Disconnect a cloud storage account
   */
  async disconnectAccount(accountId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('cloud_storage_accounts')
        .delete()
        .eq('id', accountId);
      
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error disconnecting account:', error);
      throw error;
    }
  },
  
  /**
   * Refresh the access token for a cloud storage account
   */
  async refreshToken(accountId: string): Promise<CloudStorageAccount> {
    try {
      const response = await fetch(`${API_ENDPOINTS.CLOUD_STORAGE_TOKEN}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountId }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to refresh token: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      
      // Update the account in the database
      const { error } = await supabase
        .from('cloud_storage_accounts')
        .update({
          access_token: data.account.accessToken,
          refresh_token: data.account.refreshToken,
          expires_at: data.account.expiresAt,
          last_used: new Date().toISOString(),
        })
        .eq('id', accountId);
      
      if (error) {
        throw error;
      }
      
      return data.account;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  },
  
  /**
   * List files in a cloud storage account
   */
  async listFiles(accountId: string, folderId?: string): Promise<CloudStorageFile[]> {
    try {
      const response = await fetch(`${API_ENDPOINTS.CLOUD_STORAGE_FILES}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountId, folderId }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to list files: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      return data.files;
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  },
  
  /**
   * Download a file from cloud storage
   */
  async downloadFile(accountId: string, fileId: string): Promise<File> {
    try {
      const response = await fetch(`${API_ENDPOINTS.CLOUD_STORAGE_DOWNLOAD}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountId, fileId }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to download file: ${response.status} - ${errorText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      
      // Get the file name and type from the Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const fileName = contentDisposition 
        ? contentDisposition.split('filename=')[1].trim().replace(/"/g, '') 
        : 'download.mp3';
      
      const contentType = response.headers.get('Content-Type') || 'audio/mpeg';
      
      // Create a File object from the array buffer
      return new File([arrayBuffer], fileName, { type: contentType });
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }
};
