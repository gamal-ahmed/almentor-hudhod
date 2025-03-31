
import { supabase } from "@/integrations/supabase/client";
import { API_ENDPOINTS, SUPABASE_KEY } from "./utils";
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
  async getAuthUrl(provider: CloudStorageProvider): Promise<string> {
    try {
      const response = await fetch(`${API_ENDPOINTS.CLOUD_STORAGE_AUTH}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({ provider }),
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
  async exchangeCodeForToken(provider: CloudStorageProvider, code: string): Promise<CloudStorageAccount> {
    try {
      const response = await fetch(`${API_ENDPOINTS.CLOUD_STORAGE_TOKEN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({ provider, code }),
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
  async getAccounts(): Promise<CloudStorageAccount[]> {
    try {
      // We need to cast this to any because the Supabase client is generated
      // from the database schema which doesn't include the custom table yet
      const { data, error } = await (supabase as any)
        .from("cloud_storage_accounts")
        .select("*");
      
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
      // We need to cast this to any because the Supabase client is generated
      // from the database schema which doesn't include the custom table yet
      const { error } = await (supabase as any)
        .from("cloud_storage_accounts")
        .delete()
        .eq("id", accountId);
      
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
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({ accountId }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to refresh token: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      
      // Update the account in the database
      // We need to cast this to any because the Supabase client is generated
      // from the database schema which doesn't include the custom table yet
      const { error } = await (supabase as any)
        .from("cloud_storage_accounts")
        .update({
          access_token: data.account.accessToken,
          refresh_token: data.account.refreshToken,
          expires_at: data.account.expiresAt,
          last_used: new Date().toISOString(),
        })
        .eq("id", accountId);
      
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
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
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
  async downloadFile(accountId: string, fileId: string, fileName: string): Promise<File> {
    try {
      const response = await fetch(`${API_ENDPOINTS.CLOUD_STORAGE_DOWNLOAD}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({ accountId, fileId }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to download file: ${response.status} - ${errorText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      
      // Determine file type based on extension
      const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
      let fileType = 'application/octet-stream'; // Default MIME type
      
      if (fileExtension === 'mp3') {
        fileType = 'audio/mpeg';
      } else if (fileExtension === 'wav') {
        fileType = 'audio/wav';
      } else if (fileExtension === 'ogg') {
        fileType = 'audio/ogg';
      } else if (fileExtension === 'm4a') {
        fileType = 'audio/mp4';
      }
      
      // Create a File object from the array buffer
      return new File([arrayBuffer], fileName, { type: fileType });
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }
};
