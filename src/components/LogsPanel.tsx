
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export type LogLevel = "info" | "success" | "warning" | "error" | "debug";

export interface LogMessage {
  id: string;
  message: string;
  timestamp: Date;
  level: LogLevel;
  details?: string; // Additional details that can be expanded
  source?: string;  // Source of the log (component, function, API, etc.)
  duration?: number; // Duration of the operation in ms
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
      case "debug":
        return "text-purple-400";
      default:
        return "text-gray-400";
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const [expandedLogs, setExpandedLogs] = React.useState<Record<string, boolean>>({});

  const toggleLogExpansion = (id: string) => {
    setExpandedLogs(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="h-full flex flex-col border rounded-md overflow-hidden bg-black text-green-500 font-mono text-sm">
      <div className="bg-zinc-900 px-4 py-2 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">System Logs</h3>
          <div className="flex space-x-1">
            {["success", "info", "warning", "error", "debug"].map((level) => (
              <div
                key={level}
                className={cn(
                  "w-3 h-3 rounded-full",
                  level === "success" && "bg-green-500",
                  level === "info" && "bg-blue-500",
                  level === "warning" && "bg-amber-500",
                  level === "error" && "bg-red-500",
                  level === "debug" && "bg-purple-500"
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
              <div 
                key={log.id} 
                className={cn(
                  "rounded px-2 py-1 hover:bg-zinc-900/50 transition-colors cursor-pointer",
                  expandedLogs[log.id] && "bg-zinc-900/50"
                )}
                onClick={() => log.details && toggleLogExpansion(log.id)}
              >
                <div className="flex items-start">
                  <span className="text-zinc-500 mr-2 whitespace-nowrap">[{formatTimestamp(log.timestamp)}]</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {log.source && (
                        <Badge variant="outline" className="text-xs h-5">
                          {log.source}
                        </Badge>
                      )}
                      {log.duration !== undefined && (
                        <Badge variant="outline" className="text-xs text-yellow-400 border-yellow-400/30 h-5">
                          {log.duration}ms
                        </Badge>
                      )}
                      <span className={cn(getLogColor(log.level))}>{log.message}</span>
                    </div>
                    
                    {expandedLogs[log.id] && log.details && (
                      <div className="mt-1 pl-4 border-l-2 border-zinc-800 text-xs text-zinc-400 font-light">
                        {log.details}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default LogsPanel;
