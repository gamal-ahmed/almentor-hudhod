
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const DEFAULT_PROMPT = `You will be provided with an audio file: below
and the primary language of the audio: ar-EG and en-US

Instructions:

1. Listen to the provided audio file below.
2. Identify and transcribe only the speech, ignoring any background noise or music.
3. Transcribe the Arabic and English speech. Write English words in English and Arabic words in Arabic.

4. If the audio quality is poor or unclear, indicate this in your response and identify the problematic sections (e.g., "Audio unclear from 0:15 to 0:25").
5. If the audio does not contain Arabic speech or contains predominantly another language, state that "The audio does not meet the specified language criteria."

Output Format: VTT`;

