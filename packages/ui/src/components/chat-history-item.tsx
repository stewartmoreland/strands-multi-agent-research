import { MessageSquare } from "lucide-react";
import * as React from "react";
import { cn } from "../lib/utils";

export interface ChatHistoryItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  title: string;
  timestamp: Date | number;
  messageCount?: number;
  isActive?: boolean;
}

/**
 * Format a timestamp to relative time (e.g., "10 minutes ago")
 */
function formatRelativeTime(date: Date | number): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour === 1 ? "" : "s"} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;

  return then.toLocaleDateString();
}

const ChatHistoryItem = React.forwardRef<
  HTMLButtonElement,
  ChatHistoryItemProps
>(
  (
    {
      className,
      title,
      timestamp,
      messageCount = 0,
      isActive = false,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          "w-full flex flex-col items-start gap-1 p-3 rounded-lg text-left transition-colors",
          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
          className,
        )}
        {...props}
      >
        <div className="flex items-start justify-between w-full gap-2">
          <span className="font-medium text-sm truncate flex-1">{title}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatRelativeTime(timestamp)}</span>
          <span className="text-muted-foreground/50">·</span>
          <div className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            <span>{messageCount} messages</span>
          </div>
        </div>
      </button>
    );
  },
);
ChatHistoryItem.displayName = "ChatHistoryItem";

export { ChatHistoryItem };
