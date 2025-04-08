
/**
 * Utility functions for handling time and timestamps in transcriptions
 */

/**
 * Convert a VTT timestamp string to seconds
 */
export const parseTimeToSeconds = (timeString: string): number => {
  if (!timeString) return 0;
  
  try {
    const [hours, minutes, seconds] = timeString.split(':').map(part => {
      if (part.includes('.')) {
        const [secs, ms] = part.split('.');
        return parseFloat(`${secs}.${ms}`);
      }
      return parseInt(part, 10);
    });
    
    return hours * 3600 + minutes * 60 + seconds;
  } catch (error) {
    console.error('Error parsing timestamp:', error);
    return 0;
  }
};

/**
 * Format seconds to MM:SS display format
 */
export const formatTime = (timeInSeconds: number): string => {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};
