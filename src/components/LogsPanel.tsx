
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export type LogLevel = "info" | "success" | "warning" | "error";

export interface LogMessage {
  id: string;
  message: string;
  timestamp: Date;
  level: LogLevel;
}

interface LogsPanelProps {
  logs: LogMessage[];
}

const LogsPanel = ({ logs }: LogsPanelProps) => {
  const getLogColor = (level: LogLevel) => {
    switch (level) {
      case "info":
        return "text-blue-400";
      case "success":
        return "text-green-400";
      case "warning":
        return "text-amber-400";
      case "error":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      // Remove fractionalSecondDigits as it's not supported
    });
  };

  return (
    <div className="h-full flex flex-col border rounded-md overflow-hidden bg-black text-green-500 font-mono text-sm">
      <div className="bg-zinc-900 px-4 py-2 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">System Logs</h3>
          <div className="flex space-x-1">
            {["success", "info", "warning", "error"].map((level) => (
              <div
                key={level}
                className={cn(
                  "w-3 h-3 rounded-full",
                  level === "success" && "bg-green-500",
                  level === "info" && "bg-blue-500",
                  level === "warning" && "bg-amber-500",
                  level === "error" && "bg-red-500"
                )}
              />
            ))}
          </div>
        </div>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-2">
          {logs.length === 0 ? (
            <p className="text-zinc-500 italic">No logs to display. Start a process to see logs.</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex">
                <span className="text-zinc-500 mr-2">[{formatTimestamp(log.timestamp)}]</span>
                <span className={cn(getLogColor(log.level))}>{log.message}</span>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default LogsPanel;
