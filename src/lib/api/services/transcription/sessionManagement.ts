
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

    // Delete the session from the transcription_sessions table
    const { error } = await baseService.supabase
      .from('transcription_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) {
      throw error;
    }

    return {
      success: true,
      message: "Session deleted successfully"
    };
  } catch (error) {
    console.error("Error deleting session:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unknown error occurred"
    };
  }
}
