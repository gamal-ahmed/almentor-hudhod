
/**
 * Utility functions for working with transcription models
 */

/**
 * Get a CSS class based on the model name
 */
export const getModelColor = (modelName: string): string => {
  if (!modelName) return "";
  if (modelName.includes("OpenAI")) return "bg-blue-100 dark:bg-blue-950/30";
  if (modelName.includes("Gemini")) return "bg-green-100 dark:bg-green-950/30";
  if (modelName.includes("Phi-4")) return "bg-violet-100 dark:bg-violet-950/30";
  if (modelName.includes("Speech-to-Text")) return "bg-yellow-100 dark:bg-yellow-900/30";
  return "";
};
