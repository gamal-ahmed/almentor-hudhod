
import { create } from "zustand";
import { LogLevel, LogMessage } from "@/components/LogsPanel";
import { v4 as uuidv4 } from 'uuid';

interface LogsState {
  logs: LogMessage[];
  addLog: (message: string, level: LogLevel, options?: {
    details?: string;
    source?: string;
    duration?: number;
    model?: string;  
    segments?: number;
    jobId?: string;  // Add jobId property to allow tracking of specific jobs
  }) => void;
  clearLogs: () => void;
  startTimedLog: (initialMessage: string, level: LogLevel, source?: string) => {
    complete: (finalMessage?: string, details?: string) => void;
    update: (message: string) => void;
    error: (errorMessage: string, details?: string) => void;
  };
}

export const useLogsStore = create<LogsState>((set, get) => ({
  logs: [],
  
  addLog: (message: string, level: LogLevel, options = {}) => 
    set((state) => ({
      logs: [
        ...state.logs,
        {
          id: uuidv4(),
          message,
          timestamp: new Date(),
          level,
          ...options
        }
      ],
    })),
    
  clearLogs: () => set({ logs: [] }),
  
  startTimedLog: (initialMessage: string, level: LogLevel, source?: string) => {
    const startTime = performance.now();
    const logId = uuidv4();
    
    set((state) => ({
      logs: [
        ...state.logs,
        {
          id: logId,
          message: `${initialMessage} - Started`,
          timestamp: new Date(),
          level,
          source,
        }
      ],
    }));
    
    return {
      complete: (finalMessage?: string, details?: string) => {
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);
        
        set((state) => ({
          logs: state.logs.map(log => 
            log.id === logId 
              ? {
                  ...log,
                  message: finalMessage || `${initialMessage} - Completed`,
                  details,
                  level: "success",
                  duration,
                }
              : log
          )
        }));
      },
      
      update: (message: string) => {
        set((state) => ({
          logs: state.logs.map(log => 
            log.id === logId 
              ? { ...log, message }
              : log
          )
        }));
      },
      
      error: (errorMessage: string, details?: string) => {
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);
        
        set((state) => ({
          logs: state.logs.map(log => 
            log.id === logId 
              ? {
                  ...log,
                  message: `${initialMessage} - Error: ${errorMessage}`,
                  level: "error",
                  details,
                  duration,
                }
              : log
          )
        }));
      }
    };
  }
}));
