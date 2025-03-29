
import { create } from "zustand";
import { LogLevel, LogMessage } from "@/components/LogsPanel";
import { v4 as uuidv4 } from 'uuid';

interface LogsState {
  logs: LogMessage[];
  addLog: (message: string, level: LogLevel) => void;
  clearLogs: () => void;
}

export const useLogsStore = create<LogsState>((set) => ({
  logs: [],
  addLog: (message: string, level: LogLevel) => 
    set((state) => ({
      logs: [
        ...state.logs,
        {
          id: uuidv4(),
          message,
          timestamp: new Date(),
          level,
        }
      ],
    })),
  clearLogs: () => set({ logs: [] }),
}));
