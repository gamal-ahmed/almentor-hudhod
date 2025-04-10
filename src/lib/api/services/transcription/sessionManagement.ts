
import { baseService } from "../baseService";
import { toast } from "sonner";

/**
 * Deletes a transcription session and its associated transcription jobs
 * @param sessionId The ID of the session to delete
 * @returns A promise that resolves to a success message or rejects with an error
 */
export async function deleteTranscriptionSession(sessionId: string): Promise<{ success: boolean, message: string }> {
  try {
    if (!sessionId) {
      throw new Error("No session ID provided");
    }

    console.log(`Attempting to delete session ${sessionId}`);

    // First, delete all transcriptions associated with this session
    const { error: transcriptionsError } = await baseService.supabase
      .from('transcriptions')
      .delete()
      .eq('session_id', sessionId);

    if (transcriptionsError) {
      console.error("Error deleting associated transcriptions:", transcriptionsError);
      throw transcriptionsError;
    }

    console.log(`Successfully deleted transcriptions for session ${sessionId}`);

    // Now, delete the session from the transcription_sessions table
    const { error } = await baseService.supabase
      .from('transcription_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) {
      throw error;
    }

    console.log(`Successfully deleted session ${sessionId}`);

    return {
      success: true,
      message: "Session and associated transcriptions deleted successfully"
    };
  } catch (error) {
    console.error("Error deleting session:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unknown error occurred"
    };
  }
}
