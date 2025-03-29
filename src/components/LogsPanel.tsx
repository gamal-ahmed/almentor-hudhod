
import { useRef, useEffect } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";

export type LogLevel = 'info' | 'success' | 'warning' | 'error';

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
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when new logs arrive
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [logs]);

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case 'info': return 'text-terminal-info';
      case 'success': return 'text-terminal-success';
      case 'warning': return 'text-terminal-warning';
      case 'error': return 'text-terminal-error';
      default: return 'text-terminal-text';
    }
  };

  return (
    <div className="rounded-md bg-terminal border border-border overflow-hidden h-full">
      <div className="px-4 py-2 bg-terminal-DEFAULT/80 border-b flex items-center">
        <h3 className="font-mono text-terminal-text text-sm flex-1">SYSTEM LOGS</h3>
      </div>
      <ScrollArea className="h-[calc(100%-36px)]" ref={scrollAreaRef}>
        <div className="p-4 font-mono text-xs space-y-1">
          {logs.length === 0 ? (
            <div className="text-terminal-text/50 flex items-center h-20 justify-center">
              No logs yet. Start processing a file to see logs.
            </div>
          ) : (
            logs.map((log) => (
              <div 
                key={log.id} 
                className={`terminal-log terminal-log-${log.level}`}
              >
                <span className="text-terminal-text/70">
                  [{formatTimestamp(log.timestamp)}]
                </span>{' '}
                <span className={getLevelColor(log.level)}>
                  {log.level.toUpperCase()}
                </span>:{' '}
                <span className="text-terminal-text">{log.message}</span>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default LogsPanel;
