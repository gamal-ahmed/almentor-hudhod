
interface VTTSegment {
  startTime: string;
  endTime: string;
  text: string;
}

export function parseVTT(vttContent: string): VTTSegment[] {
  if (!vttContent || typeof vttContent !== 'string') return [];
  
  try {
    // Split the content by line breaks
    const lines = vttContent.split("\n");
    
    // Skip the WEBVTT header
    let currentLine = 1;
    while (currentLine < lines.length && !lines[currentLine].includes("-->")) {
      currentLine++;
    }
    
    const segments: VTTSegment[] = [];
    
    while (currentLine < lines.length) {
      // Skip empty lines
      if (lines[currentLine].trim() === "") {
        currentLine++;
        continue;
      }
      
      // Parse timestamp line
      if (lines[currentLine].includes("-->")) {
        const timestampLine = lines[currentLine];
        const timestampParts = timestampLine.split("-->");
        
        if (timestampParts.length < 2) {
          // Invalid timestamp line, skip it
          currentLine++;
          continue;
        }
        
        const startTime = timestampParts[0].trim();
        const endTime = timestampParts[1].trim();
        
        // Collect all text lines until next timestamp or empty line
        let textContent = "";
        currentLine++;
        
        while (currentLine < lines.length && 
              lines[currentLine].trim() !== "" && 
              !lines[currentLine].includes("-->")) {
          textContent += (textContent ? "\n" : "") + lines[currentLine];
          currentLine++;
        }
        
        if (textContent) {
          segments.push({
            startTime: formatTimestamp(startTime),
            endTime: formatTimestamp(endTime),
            text: textContent
          });
        }
      } else {
        // Skip unexpected lines
        currentLine++;
      }
    }
    
    return segments;
  } catch (error) {
    console.error("Error parsing VTT content:", error);
    return [];
  }
}

function formatTimestamp(timestamp: string): string {
  try {
    // Already in a good format (hh:mm:ss.ms)
    if (timestamp.includes(":")) {
      return timestamp;
    }
    
    // Convert numeric timestamp to hh:mm:ss.ms format
    const totalSeconds = parseFloat(timestamp);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const milliseconds = Math.round((totalSeconds % 1) * 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  } catch (error) {
    console.error("Error formatting timestamp:", error);
    return "00:00:00.000";
  }
}
