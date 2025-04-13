
/**
 * Properly encode to base64 for Gemini API
 * @param buffer The array buffer to encode
 * @param mimeType The MIME type of the audio file
 * @returns A base64 encoded string
 */
export async function properlyEncodedBase64(buffer: ArrayBuffer, mimeType: string): Promise<string> {
  const bytes = new Uint8Array(buffer);
  
  // Convert to a binary string first
  let binary = '';
  const chunkSize = 1024; // Use small chunks to avoid stack issues
  
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, Math.min(i + chunkSize, bytes.length));
    for (let j = 0; j < chunk.length; j++) {
      binary += String.fromCharCode(chunk[j]);
    }
  }
  
  // Use btoa for standard base64 encoding
  // This needs to be called once on the complete binary string
  // to ensure proper padding and formatting
  return btoa(binary);
}
