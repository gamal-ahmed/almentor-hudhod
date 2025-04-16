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

/**
 * Get a display name for the model
 */
export const getModelDisplayName = (model: string): string => {
  if (!model) return "Unknown Model";
  
  switch (model.toLowerCase()) {
    case "openai":
      return "OpenAI Whisper";
    case "gemini-2.0-flash":
    case "gemini":
      return "Gemini 2.0 Flash";
    case "phi4":
    case "phi-4":
      return "Microsoft Phi-4";
    case "speech-to-text":
      return "Speech to Text";
    default:
      // If it's already a display name format, return it
      if (model.includes(" ")) return model;
      // Otherwise capitalize the first letter of each word
      return model.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
  }
};
