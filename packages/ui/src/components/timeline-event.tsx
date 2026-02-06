import { CheckCircle, Circle, Loader2, Wrench, XCircle } from "lucide-react";
import * as React from "react";
import { cn } from "../lib/utils";
import { Badge } from "./badge";

export type TimelineEventStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed";

export interface TimelineEventProps {
  toolName: string;
  status: TimelineEventStatus;
  input?: unknown;
  output?: unknown;
  startTime: number;
  endTime?: number;
  isExpanded?: boolean;
  onToggle?: () => void;
}

const statusConfig: Record<
  TimelineEventStatus,
  { icon: React.ElementType; color: string; label: string }
> = {
  pending: { icon: Circle, color: "text-muted-foreground", label: "Pending" },
  running: { icon: Loader2, color: "text-blue-500", label: "Running" },
  completed: { icon: CheckCircle, color: "text-green-500", label: "Completed" },
  failed: { icon: XCircle, color: "text-destructive", label: "Failed" },
};

const TimelineEvent = React.forwardRef<HTMLDivElement, TimelineEventProps>(
  (
    {
      toolName,
      status,
      input,
      output,
      startTime,
      endTime,
      isExpanded = false,
      onToggle,
    },
    ref,
  ) => {
    const config = statusConfig[status];
    const StatusIcon = config.icon;
    const duration = endTime ? endTime - startTime : null;

    return (
      <div ref={ref} className="relative pl-6 pb-4">
        {/* Timeline line */}
        <div className="absolute left-2 top-0 bottom-0 w-px bg-border" />

        {/* Status icon */}
        <div
          className={cn(
            "absolute left-0 top-1 flex items-center justify-center w-4 h-4 bg-background",
            config.color,
          )}
        >
          <StatusIcon
            className={cn("h-4 w-4", status === "running" && "animate-spin")}
          />
        </div>

        {/* Event content */}
        <div
          className={cn(
            "rounded-lg border bg-card p-3",
            onToggle && "cursor-pointer hover:bg-accent/50",
          )}
          onClick={onToggle}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">{toolName}</span>
            </div>
            <Badge variant={status === "failed" ? "destructive" : "secondary"}>
              {config.label}
            </Badge>
          </div>

          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <span>{new Date(startTime).toLocaleTimeString()}</span>
            {duration !== null && (
              <>
                <span>·</span>
                <span>{duration}ms</span>
              </>
            )}
          </div>

          {/* Expanded content */}
          {isExpanded && (
            <div className="mt-3 space-y-2">
              {input !== undefined && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground">
                    Input:
                  </span>
                  <pre className="mt-1 p-2 rounded bg-muted text-xs overflow-auto max-h-32">
                    {typeof input === "string"
                      ? input
                      : JSON.stringify(input, null, 2)}
                  </pre>
                </div>
              )}
              {output !== undefined && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground">
                    Output:
                  </span>
                  <pre className="mt-1 p-2 rounded bg-muted text-xs overflow-auto max-h-32">
                    {typeof output === "string"
                      ? output
                      : JSON.stringify(output, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  },
);
TimelineEvent.displayName = "TimelineEvent";

export { TimelineEvent };
