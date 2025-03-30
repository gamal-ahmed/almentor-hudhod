
/**
 * Utility functions for browser notifications
 */

// Check if browser notifications are supported
export const isNotificationsSupported = () => {
  return 'Notification' in window;
};

// Request notification permissions
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isNotificationsSupported()) {
    console.warn('Browser notifications are not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    console.warn('Notification permission was denied');
    return false;
  }

  // Need to request permission
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

// Show a notification
export const showNotification = (
  title: string, 
  options?: NotificationOptions
): boolean => {
  if (!isNotificationsSupported()) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  try {
    const defaultOptions: NotificationOptions = {
      icon: '/favicon.ico',
      ...options
    };

    new Notification(title, defaultOptions);
    return true;
  } catch (error) {
    console.error('Error showing notification:', error);
    return false;
  }
};
