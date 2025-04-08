
// Format time in seconds to a human-readable MM:SS format
export function formatTime(timeInSeconds: number): string {
  if (!Number.isFinite(timeInSeconds) || timeInSeconds < 0) {
    return "00:00";
  }
  
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Parse time string from VTT format (HH:MM:SS.mmm) to seconds
export function parseTimeToSeconds(timeString: string): number {
  try {
    // Handle different time formats
    if (!timeString) return 0;

    // If it's already a number, return it
    if (typeof timeString === 'number') return timeString;
    
    // If not in the expected format, try to clean it up
    if (!timeString.match(/^\d{2}:\d{2}:\d{2}\.\d{3}$/)) {
      // Try to fix common issues with timestamp formatting
      timeString = timeString.trim();
      
      // If it's just seconds
      if (/^\d+(\.\d+)?$/.test(timeString)) {
        return parseFloat(timeString);
      }
      
      // Try to handle MM:SS format
      if (/^\d{1,2}:\d{2}(\.\d+)?$/.test(timeString)) {
        const [minutes, secondsWithMs] = timeString.split(':');
        return parseInt(minutes) * 60 + parseFloat(secondsWithMs);
      }
      
      // Try to massage into standard format
      timeString = timeString.replace(/\s/g, '')
        .replace(/^(\d{1}):/, '0$1:')
        .replace(/^(\d{2}):(\d{1}):/, '$1:0$2:')
        .replace(/^(\d{2}):(\d{2}):(\d{1})\./, '$1:$2:0$3.')
        .replace(/^(\d{2}):(\d{2}):(\d{2})$/, '$1:$2:$3.000');
        
      // Still doesn't match our format, default to 0
      if (!timeString.match(/^\d{2}:\d{2}:\d{2}\.\d{3}$/)) {
        console.warn(`Invalid time format after cleanup: ${timeString}`);
        return 0;
      }
    }
    
    const [hours, minutes, seconds] = timeString.split(':');
    const [secondsValue, millisecondsValue] = seconds.split('.');
    
    const hoursInSeconds = parseInt(hours) * 3600;
    const minutesInSeconds = parseInt(minutes) * 60;
    const secondsValue2 = parseInt(secondsValue);
    const millisecondsInSeconds = parseInt(millisecondsValue) / 1000;
    
    // Validate each component
    if (!Number.isFinite(hoursInSeconds) || 
        !Number.isFinite(minutesInSeconds) || 
        !Number.isFinite(secondsValue2) ||
        !Number.isFinite(millisecondsInSeconds)) {
      console.warn(`Invalid time components in: ${timeString}`);
      return 0;
    }
    
    return hoursInSeconds + minutesInSeconds + secondsValue2 + millisecondsInSeconds;
  } catch (error) {
    console.error(`Error parsing time: ${timeString}`, error);
    return 0;
  }
}
