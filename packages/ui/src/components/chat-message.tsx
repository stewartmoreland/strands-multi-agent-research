import { Bot, User } from 'lucide-react'
import * as React from 'react'
import { useIsMobile } from '../hooks/use-mobile'
import { cn } from '../lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from './avatar'
import { MarkdownContent } from './markdown-content'

export interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  timestamp?: number
  isStreaming?: boolean
  avatarUrl?: string
}

const ChatMessage = React.forwardRef<HTMLDivElement, ChatMessageProps>(
  ({ role, content, timestamp, isStreaming, avatarUrl }, ref) => {
    const isMobile = useIsMobile()
    const isUser = role === 'user'

    return (
      <div ref={ref} className={cn('flex gap-3 w-full', isUser ? 'flex-row-reverse' : 'flex-row')}>
        <Avatar
          className={cn(
            'h-9 w-9 shrink-0 border-2 shadow-sm transition-transform duration-200 hover:scale-105',
            isUser ? 'bg-primary border-primary/20' : 'bg-linear-to-br from-secondary to-accent border-secondary/30',
          )}
        >
          <AvatarFallback className={isUser ? 'bg-primary' : 'bg-secondary'}>
            {isUser ? (
              <User className="h-4 w-4 text-primary-foreground" />
            ) : (
              <Bot className="h-4 w-4 text-secondary-foreground" />
            )}
          </AvatarFallback>
          <AvatarImage src={avatarUrl} />
        </Avatar>

        <div
          className={cn(
            'flex min-w-0 flex-col gap-1.5 overflow-hidden',
            isUser ? 'items-end' : 'items-start',
            isMobile ? 'w-[90%] max-w-[90%]' : 'w-[65%] max-w-[65%]',
          )}
        >
          <div
            className={cn(
              'min-w-0 max-w-full overflow-hidden rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm',
              'transition-all duration-200',
              isUser
                ? 'bg-primary text-primary-foreground rounded-br-md'
                : 'bg-muted/80 text-foreground rounded-bl-md border border-border/50',
            )}
          >
            {isUser ? (
              <div className="whitespace-pre-wrap wrap-break-word">
                {content}
                {isStreaming && (
                  <span className="inline-flex items-center ml-1.5 gap-0.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-current animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    />
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-current animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    />
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-current animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    />
                  </span>
                )}
              </div>
            ) : (
              <div className="min-w-0 max-w-full wrap-break-word">
                <MarkdownContent className="min-w-0 max-w-full">{content}</MarkdownContent>
                {isStreaming && (
                  <span className="inline-flex items-center ml-1.5 gap-0.5 align-middle">
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-current animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    />
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-current animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    />
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-current animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    />
                  </span>
                )}
              </div>
            )}
          </div>

          {timestamp && (
            <span className="text-[11px] text-muted-foreground/70 px-1">
              {new Date(timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
        </div>
      </div>
    )
  },
)
ChatMessage.displayName = 'ChatMessage'

export { ChatMessage }
