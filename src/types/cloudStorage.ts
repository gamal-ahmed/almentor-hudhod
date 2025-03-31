
// Cloud Storage Provider Types
export type CloudStorageProvider = 'google-drive' | 'dropbox';

export interface CloudStorageAccount {
  id: string;
  provider: CloudStorageProvider;
  userId: string;
  email: string;
  name: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  createdAt: string;
  lastUsed?: string;
}

export interface CloudStorageFile {
  id: string;
  name: string;
  mimeType: string;
  size: number; 
  iconLink?: string;
  thumbnailLink?: string;
  webViewLink?: string;
  path?: string;
  parentFolder?: string;
  modifiedTime?: string;
}

export interface CloudStorageFolder {
  id: string;
  name: string;
  path?: string;
  parentFolder?: string;
}

export interface CloudStorageError {
  code: string;
  message: string;
  provider: CloudStorageProvider;
}
