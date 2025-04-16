// Enhanced parseVTT function with better error handling
export function parseVTT(vttContent: string) {
  try {
    // Check if the content is empty or not a string
    if (!vttContent || typeof vttContent !== 'string') {
      console.error('Invalid VTT content:', vttContent);
      return [];
    }

    // Ensure the content starts with WEBVTT
    if (!vttContent.trim().startsWith('WEBVTT')) {
      vttContent = `WEBVTT\n\n${vttContent}`;
    }
    
    // Split the content into lines
    const lines = vttContent.split('\n');
    console.log('VTT split into', lines.length, 'lines');

    const segments: {
      startTime: string;
      endTime: string;
      text: string;
    }[] = [];

    let currentSegment: { startTime: string; endTime: string; text: string } | null = null;
    let inCue = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines and WEBVTT header
      if (line === '' || line === 'WEBVTT') {
        continue;
      }

      // If we find a timestamp line (contains -->)
      if (line.includes('-->')) {
        const [startTime, endTime] = line.split('-->').map(t => t.trim());
        
        // Create a new segment
        currentSegment = {
          startTime,
          endTime,
          text: ''
        };
        inCue = true;
      } 
      // Add text content to the current segment
      else if (inCue && currentSegment) {
        // Add the line to the current segment's text
        if (currentSegment.text.length > 0) {
          currentSegment.text += ' ' + line;
        } else {
          currentSegment.text = line;
        }

        // Check if the next line is empty or a new cue timestamp
        // If so, add the completed segment and reset
        const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : '';
        if (nextLine === '' || nextLine.includes('-->') || i === lines.length - 1) {
          if (currentSegment.text) {
            segments.push({ ...currentSegment });
          }
          inCue = false;
          currentSegment = null;
        }
      }
    }

    console.log('Successfully parsed', segments.length, 'VTT segments');
    return segments;
  } catch (error) {
    console.error('Error parsing VTT:', error);
    return [];
  }
}
