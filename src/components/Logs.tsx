
import { useLogsStore } from "@/lib/useLogsStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertCircle, CheckCircle, Info, Bug } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function Logs() {
  const logs = useLogsStore((state) => state.logs);
  const clearLogs = useLogsStore((state) => state.clearLogs);

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'debug':
        return <Bug className="h-4 w-4 text-purple-500" />;
      case 'info':
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getLogLevelStyle = (level: string) => {
    switch (level) {
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'debug':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'info':
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-2">
        <Badge variant="outline">Logs: {logs.length}</Badge>
        <button 
          className="text-xs text-muted-foreground hover:text-foreground"
          onClick={clearLogs}
        >
          Clear logs
        </button>
      </div>
      <ScrollArea className="h-[300px] rounded-md border p-2">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <Info className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No logs yet. Activity will appear here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="text-xs border rounded-md p-2 dark:border-gray-700">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-1.5">
                    {getLogIcon(log.level)}
                    <Badge variant="outline" className={`${getLogLevelStyle(log.level)} text-[10px] py-0 px-1`}>
                      {log.level}
                    </Badge>
                    {log.source && (
                      <Badge variant="outline" className="text-[10px] py-0 px-1">
                        {log.source}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                    {log.duration && (
                      <span className="ml-1">({log.duration}ms)</span>
                    )}
                  </div>
                </div>
                <p className="mt-1">{log.message}</p>
                {log.details && (
                  <div className="mt-1 px-2 py-1 bg-muted rounded text-[10px] font-mono whitespace-pre-wrap">
                    {log.details}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
