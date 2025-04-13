
// Enhanced default prompt with more explicit instructions
export const DEFAULT_PROMPT = "IMPORTANT: Transcribe the exact words as spoken. Do not translate, paraphrase, or modify any English words, names, acronyms, or technical terms. Preserve all English words exactly as they are spoken.";

/**
 * Enhance the user prompt if it doesn't already have strong preservation instructions
 * @param userPrompt The user-provided prompt
 * @returns An enhanced prompt with preservation instructions
 */
export function enhanceUserPrompt(userPrompt: string | null): string {
  const prompt = userPrompt || DEFAULT_PROMPT;
  
  // Add the default preservation instructions if they're not already included
  if (!prompt.toLowerCase().includes('preserve') && !prompt.toLowerCase().includes('exact')) {
    return `${DEFAULT_PROMPT}\n\nAdditional context: ${prompt}`;
  }
  
  return prompt;
}
