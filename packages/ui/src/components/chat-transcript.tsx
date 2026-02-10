import * as React from 'react'
import { cn } from '../lib/utils'
import { ChatMessage, type ChatMessageProps } from './chat-message'
import { ScrollArea } from './scroll-area'
import { ThinkingAccordion } from './thinking-accordion'
import { type ToolExecution } from './thinking-timeline'
import { ToolCallAccordion } from './tool-call-accordion'

export interface Message extends ChatMessageProps {
  id: string
}

export type { ToolExecution }

// ── Transcript items: a union type that enables ordered, interleaved rendering ──

export interface MessageItem {
  kind: 'message'
  id: string
  message: Message
  isStreaming?: boolean
}

export interface ThinkingItem {
  kind: 'thinking'
  id: string
  content: string
  isStreaming?: boolean
}

export interface ToolCallItem {
  kind: 'tool'
  id: string
  execution: ToolExecution
}

export type TranscriptItem = MessageItem | ThinkingItem | ToolCallItem

// ── Props ──

export interface ChatTranscriptProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Ordered list of transcript items (messages, thinking, tools) to render in sequence. */
  items?: TranscriptItem[]

  // Legacy props (still supported for backward-compat but `items` takes priority)
  messages?: Message[]
  streamingMessageId?: string
  thinkingContent?: string
  isThinkingStreaming?: boolean
  toolExecutions?: ToolExecution[]

  emptyStateTitle?: string
  emptyStateDescription?: string
  userAvatarUrl?: string
}

const ChatTranscript = React.forwardRef<HTMLDivElement, ChatTranscriptProps>(
  (
    {
      className,
      items,
      messages,
      streamingMessageId,
      thinkingContent,
      isThinkingStreaming = false,
      toolExecutions = [],
      emptyStateTitle = 'No messages yet. Say hello to start.',
      emptyStateDescription,
      userAvatarUrl,
      ...props
    },
    ref,
  ) => {
    const scrollRef = React.useRef<HTMLDivElement>(null)

    // Build the item list: prefer `items` if supplied; fall back to legacy props
    const resolvedItems: TranscriptItem[] = React.useMemo(() => {
      if (items && items.length > 0) return items

      // Legacy: build from separate arrays (same old order)
      const legacy: TranscriptItem[] = []
      if (messages) {
        for (const m of messages) {
          legacy.push({
            kind: 'message',
            id: m.id,
            message: m,
            isStreaming: m.id === streamingMessageId,
          })
        }
      }
      if (thinkingContent) {
        legacy.push({
          kind: 'thinking',
          id: 'thinking-current',
          content: thinkingContent,
          isStreaming: isThinkingStreaming,
        })
      }
      for (const t of toolExecutions) {
        legacy.push({ kind: 'tool', id: t.id, execution: t })
      }
      return legacy
    }, [items, messages, streamingMessageId, thinkingContent, isThinkingStreaming, toolExecutions])

    // Auto-scroll to bottom when items update
    React.useEffect(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    }, [resolvedItems])

    const isEmpty = resolvedItems.length === 0

    return (
      <div ref={ref} className={cn('flex flex-col h-full', className)} {...props}>
        <ScrollArea className="flex-1">
          <div ref={scrollRef} className="flex flex-col gap-4 px-3 py-4 sm:px-6 sm:py-6 lg:px-8 max-w-3xl mx-auto">
            {isEmpty ? (
              <div className="flex flex-col items-center justify-center min-h-[200px] py-12 text-muted-foreground border border-dashed rounded-xl bg-muted/30 animate-in fade-in duration-500">
                <p className="text-base font-medium">{emptyStateTitle}</p>
                {emptyStateDescription && (
                  <p className="text-sm mt-2 text-muted-foreground/80">{emptyStateDescription}</p>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {resolvedItems.map((item, index) => {
                  switch (item.kind) {
                    case 'message':
                      return (
                        <div
                          key={item.id}
                          className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300"
                          style={{
                            animationDelay: `${Math.min(index * 50, 200)}ms`,
                          }}
                        >
                          <ChatMessage
                            role={item.message.role}
                            content={item.message.content}
                            timestamp={item.message.timestamp}
                            isStreaming={item.isStreaming}
                            avatarUrl={item.message.role === 'user' ? userAvatarUrl : undefined}
                          />
                        </div>
                      )

                    case 'thinking':
                      return (
                        <div
                          key={item.id}
                          className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300 pl-9 sm:pl-12"
                        >
                          <ThinkingAccordion content={item.content} isStreaming={item.isStreaming} />
                        </div>
                      )

                    case 'tool':
                      return (
                        <div
                          key={item.id}
                          className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300 pl-9 sm:pl-12"
                        >
                          <ToolCallAccordion
                            toolName={item.execution.toolName}
                            input={item.execution.input}
                            output={item.execution.output}
                            status={item.execution.status}
                            duration={
                              item.execution.endTime && item.execution.startTime
                                ? item.execution.endTime - item.execution.startTime
                                : undefined
                            }
                          />
                        </div>
                      )
                  }
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    )
  },
)
ChatTranscript.displayName = 'ChatTranscript'

export { ChatTranscript }
