
export function getModelDisplayName(model: string) {
  switch (model) {
    case "openai":
      return "OpenAI Whisper";
    case "gemini-2.0-flash":
      return "Gemini 2.0 Flash";
    case "phi4":
      return "Microsoft Phi-4";
    default:
      return model;
  }
}

export function getAudioFileName(filePath: string) {
  if (!filePath) return 'Unknown file';
  return filePath.split('/').pop()?.replace(/_/g, ' ') || 'Unknown file';
}
