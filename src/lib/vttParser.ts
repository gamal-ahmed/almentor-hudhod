
// Enhanced parseVTT function with better format handling
export function parseVTT(vttContent: string) {
  try {
    // Check if the content is empty or not a string
    if (!vttContent || typeof vttContent !== 'string') {
      console.error('Invalid VTT content:', vttContent);
      return [];
    }

    // Clean up potential formatting issues
    let cleanContent = vttContent
      .replace(/WEBVTT\s*FILE/i, 'WEBVTT') // Normalize header
      .replace(/(\d{2}:\d{2}:\d{2})(\s*)-->(\s*)(\d{2}:\d{2}:\d{2})/g, '$1.000 --> $4.000') // Add milliseconds if missing
      .replace(/(\d+:\d+)\s+-->\s+(\d+:\d+)/g, '00:$1.000 --> 00:$2.000') // Handle MM:SS format
      .replace(/NOTE\s+.*\n/g, '') // Remove NOTE lines
      .replace(/^\s*$\n/gm, ''); // Remove empty lines

    // Ensure the content starts with WEBVTT
    if (!cleanContent.trim().startsWith('WEBVTT')) {
      cleanContent = `WEBVTT\n\n${cleanContent}`;
    }
    
    // Split the content into lines
    const lines = cleanContent.split('\n');
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

      // Check for timestamp line (contains -->)
      if (line.includes('-->')) {
        // Extract and normalize timestamps
        const [startTime, endTime] = line.split('-->').map(t => {
          let time = t.trim();
          // Add milliseconds if missing
          if (!time.includes('.')) {
            time += '.000';
          }
          // Add hours if missing
          if (time.split(':').length === 2) {
            time = '00:' + time;
          }
          return time;
        });
        
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
        // Clean up any timestamp-like patterns from the text
        const cleanedLine = line
          .replace(/\d{2}:\d{2}:\d{2}\.\d{3}/g, '') // Remove full timestamps
          .replace(/\d{2}:\d{2}:\d{2}/g, '') // Remove timestamps without milliseconds
          .replace(/\d{2}:\d{2}/g, '') // Remove MM:SS format
          .trim();

        if (cleanedLine) {
          // Add the cleaned line to the current segment's text
          if (currentSegment.text.length > 0) {
            currentSegment.text += ' ' + cleanedLine;
          } else {
            currentSegment.text = cleanedLine;
          }
        }

        // Check if the next line is empty or a new cue timestamp
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
