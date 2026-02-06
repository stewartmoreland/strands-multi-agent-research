import * as React from "react";
import { cn } from "../lib/utils";
import { ChatMessage, type ChatMessageProps } from "./chat-message";
import { ScrollArea } from "./scroll-area";
import { ThinkingAccordion } from "./thinking-accordion";
import { type ToolExecution } from "./thinking-timeline";
import { ToolCallAccordion } from "./tool-call-accordion";

export interface Message extends ChatMessageProps {
  id: string;
}

export type { ToolExecution };

export interface ChatTranscriptProps extends React.HTMLAttributes<HTMLDivElement> {
  messages: Message[];
  streamingMessageId?: string;
  thinkingContent?: string;
  isThinkingStreaming?: boolean;
  toolExecutions?: ToolExecution[];
  emptyStateTitle?: string;
  emptyStateDescription?: string;
}

const ChatTranscript = React.forwardRef<HTMLDivElement, ChatTranscriptProps>(
  (
    {
      className,
      messages,
      streamingMessageId,
      thinkingContent,
      isThinkingStreaming = false,
      toolExecutions = [],
      emptyStateTitle = "No messages yet. Say hello to start.",
      emptyStateDescription,
      ...props
    },
    ref,
  ) => {
    const scrollRef = React.useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new messages arrive
    React.useEffect(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, [messages, thinkingContent, toolExecutions]);

    const isEmpty =
      messages.length === 0 && !thinkingContent && toolExecutions.length === 0;

    return (
      <div
        ref={ref}
        className={cn("flex flex-col h-full", className)}
        {...props}
      >
        <ScrollArea className="flex-1">
          <div
            ref={scrollRef}
            className="flex flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8 max-w-3xl mx-auto"
          >
            {isEmpty ? (
              <div className="flex flex-col items-center justify-center min-h-[200px] py-12 text-muted-foreground border border-dashed rounded-xl bg-muted/30 animate-in fade-in duration-500">
                <p className="text-base font-medium">{emptyStateTitle}</p>
                {emptyStateDescription && (
                  <p className="text-sm mt-2 text-muted-foreground/80">
                    {emptyStateDescription}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {messages.map((message, index) => (
                  <div
                    key={message.id}
                    className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300"
                    style={{ animationDelay: `${Math.min(index * 50, 200)}ms` }}
                  >
                    <ChatMessage
                      role={message.role}
                      content={message.content}
                      timestamp={message.timestamp}
                      isStreaming={message.id === streamingMessageId}
                    />
                  </div>
                ))}

                {/* Thinking accordion - shown after user message, before assistant responds */}
                {thinkingContent && (
                  <div className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                    <ThinkingAccordion
                      content={thinkingContent}
                      isStreaming={isThinkingStreaming}
                    />
                  </div>
                )}

                {/* Tool call accordions */}
                {toolExecutions.map((tool, index) => (
                  <div
                    key={tool.id}
                    className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <ToolCallAccordion
                      toolName={tool.toolName}
                      input={tool.input}
                      output={tool.output}
                      status={tool.status}
                      duration={
                        tool.endTime && tool.startTime
                          ? tool.endTime - tool.startTime
                          : undefined
                      }
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  },
);
ChatTranscript.displayName = "ChatTranscript";

export { ChatTranscript };
