
// Defining the CloudStorageConfig interface
export interface CloudStorageConfig {
  googleDrive: {
    clientId: string;
    apiKey: string;
  };
  dropbox: {
    appKey: string;
  }
}

// Interface for connection status
export interface ConnectionStatus {
  googleDrive: boolean;
  dropbox: boolean;
}

// Local storage keys for cloud storage configuration
const CLOUD_STORAGE_CONFIG_KEY = 'cloud_storage_config';
const CONNECTION_STATUS_KEY = 'cloud_storage_connection_status';

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

// Default connection status
const defaultConnectionStatus: ConnectionStatus = {
  googleDrive: false,
  dropbox: false
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

// Get connection status from localStorage
export function getConnectionStatus(): ConnectionStatus {
  try {
    const storedStatus = localStorage.getItem(CONNECTION_STATUS_KEY);
    if (storedStatus) {
      return JSON.parse(storedStatus);
    }
  } catch (error) {
    console.error('Error loading connection status:', error);
  }
  return defaultConnectionStatus;
}

// Save connection status to localStorage
export function saveConnectionStatus(status: ConnectionStatus): void {
  try {
    localStorage.setItem(CONNECTION_STATUS_KEY, JSON.stringify(status));
  } catch (error) {
    console.error('Error saving connection status:', error);
  }
}

// Connect a platform
export function connectPlatform(platform: 'googleDrive' | 'dropbox'): void {
  const status = getConnectionStatus();
  status[platform] = true;
  saveConnectionStatus(status);
}

// Disconnect a platform
export function disconnectPlatform(platform: 'googleDrive' | 'dropbox'): void {
  const status = getConnectionStatus();
  status[platform] = false;
  saveConnectionStatus(status);
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

// Check if a platform is connected
export function isPlatformConnected(platform: 'googleDrive' | 'dropbox'): boolean {
  const status = getConnectionStatus();
  return status[platform];
}
