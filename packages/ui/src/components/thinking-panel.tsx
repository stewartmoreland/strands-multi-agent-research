import { Brain, ChevronDown, ChevronUp } from "lucide-react";
import * as React from "react";
import { cn } from "../lib/utils";
import { Button } from "./button";
import { ScrollArea } from "./scroll-area";

export interface ThinkingPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  content: string;
  title?: string;
  defaultExpanded?: boolean;
}

const ThinkingPanel = React.forwardRef<HTMLDivElement, ThinkingPanelProps>(
  (
    {
      className,
      content,
      title = "Reasoning",
      defaultExpanded = false,
      ...props
    },
    ref,
  ) => {
    const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);
    const scrollRef = React.useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when content updates
    React.useEffect(() => {
      if (scrollRef.current && isExpanded) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, [content, isExpanded]);

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col border rounded-lg bg-card overflow-hidden",
          className,
        )}
        {...props}
      >
        {/* Header */}
        <Button
          variant="ghost"
          className="flex items-center justify-between w-full px-4 py-2 rounded-none"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm">{title}</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>

        {/* Content */}
        {isExpanded && (
          <div className="border-t">
            <ScrollArea className="max-h-48">
              <div ref={scrollRef} className="p-4">
                {content ? (
                  <pre className="text-xs font-mono whitespace-pre-wrap text-muted-foreground">
                    {content}
                  </pre>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    No reasoning content available
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    );
  },
);
ThinkingPanel.displayName = "ThinkingPanel";

export { ThinkingPanel };
