
import { CloudStorageConfig } from "./index";

// Local storage keys for cloud storage configuration
const CLOUD_STORAGE_CONFIG_KEY = 'cloud_storage_config';

// Default empty configuration
const defaultConfig: CloudStorageConfig = {
  googleDrive: {
    clientId: '',
    apiKey: ''
  },
  dropbox: {
    appKey: ''
  }
};

// Load cloud storage configuration from localStorage
export function getCloudStorageConfig(): CloudStorageConfig {
  try {
    const storedConfig = localStorage.getItem(CLOUD_STORAGE_CONFIG_KEY);
    if (storedConfig) {
      return JSON.parse(storedConfig);
    }
  } catch (error) {
    console.error('Error loading cloud storage config:', error);
  }
  return defaultConfig;
}

// Save cloud storage configuration to localStorage
export function saveCloudStorageConfig(config: CloudStorageConfig): void {
  try {
    localStorage.setItem(CLOUD_STORAGE_CONFIG_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Error saving cloud storage config:', error);
  }
}

// Update a specific platform configuration
export function updatePlatformConfig(
  platform: 'googleDrive' | 'dropbox',
  config: Partial<CloudStorageConfig['googleDrive']> | Partial<CloudStorageConfig['dropbox']>
): void {
  const currentConfig = getCloudStorageConfig();
  const updatedConfig = {
    ...currentConfig,
    [platform]: {
      ...currentConfig[platform],
      ...config
    }
  };
  saveCloudStorageConfig(updatedConfig);
}

// Check if a platform is configured with valid credentials
export function isPlatformConfigured(platform: 'googleDrive' | 'dropbox'): boolean {
  const config = getCloudStorageConfig();
  
  if (platform === 'googleDrive') {
    return Boolean(config.googleDrive.clientId && config.googleDrive.apiKey);
  } else if (platform === 'dropbox') {
    return Boolean(config.dropbox.appKey);
  }
  
  return false;
}
