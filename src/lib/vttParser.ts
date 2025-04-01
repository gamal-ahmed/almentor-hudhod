
interface VTTSegment {
  startTime: string;
  endTime: string;
  text: string;
}

export const parseVTT = (vttContent: string): VTTSegment[] => {
  if (!vttContent || typeof vttContent !== 'string') return [];
  
  try {
    console.log(`Parsing VTT content (length: ${vttContent.length})`);
    
    // If content doesn't start with WEBVTT, try to add it
    if (!vttContent.trim().startsWith("WEBVTT")) {
      console.log("VTT content doesn't start with WEBVTT, adding header");
      vttContent = "WEBVTT\n\n" + vttContent.trim();
    }
    
    // Split the content by line breaks
    const lines = vttContent.split("\n");
    console.log(`VTT split into ${lines.length} lines`);
    
    // Skip the WEBVTT header
    let currentLine = 0;
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
          console.warn(`Invalid timestamp line: ${timestampLine}`);
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
        console.warn(`Skipping unexpected line: ${lines[currentLine]}`);
        currentLine++;
      }
    }
    
    console.log(`Successfully parsed ${segments.length} VTT segments`);
    return segments;
  } catch (error) {
    console.error("Error parsing VTT content:", error);
    
    // Attempt a fallback parsing for simple content
    try {
      console.log("Attempting fallback VTT parsing");
      const textContent = vttContent.replace(/WEBVTT|-->|\d{2}:\d{2}:\d{2}\.\d{3}/g, '').trim();
      
      if (textContent) {
        console.log("Using fallback plain text parsing");
        // Create a single segment with the entire text
        return [{
          startTime: "00:00:00.000",
          endTime: "00:01:00.000",
          text: textContent
        }];
      }
    } catch (fallbackError) {
      console.error("Fallback parsing also failed:", fallbackError);
    }
    
    return [];
  }
};

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

// Add an object to maintain backwards compatibility with code using VttParser.parseVTT
export const VttParser = {
  parseVTT
};
