import { Brain } from 'lucide-react'
import * as React from 'react'
import { cn } from '../lib/utils'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './accordion'

export interface ThinkingAccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  content: string
  isStreaming?: boolean
  defaultExpanded?: boolean
  maxCollapsedLines?: number
}

/**
 * Get the last N lines from a string
 */
function getLastLines(text: string, n: number): string {
  const lines = text.split('\n').filter((line) => line.trim() !== '')
  if (lines.length <= n) return text
  return lines.slice(-n).join('\n')
}

const ThinkingAccordion = React.forwardRef<HTMLDivElement, ThinkingAccordionProps>(
  ({ className, content, isStreaming = false, defaultExpanded = false, maxCollapsedLines = 4, ...props }, ref) => {
    const [isExpanded, setIsExpanded] = React.useState(defaultExpanded)
    const scrollRef = React.useRef<HTMLDivElement>(null)

    // Auto-scroll to bottom when content updates and expanded
    React.useEffect(() => {
      if (scrollRef.current && isExpanded) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    }, [content, isExpanded])

    // Get preview content (last 4 lines)
    const previewContent = React.useMemo(() => getLastLines(content, maxCollapsedLines), [content, maxCollapsedLines])

    const hasMoreContent = content.split('\n').filter((l) => l.trim()).length > maxCollapsedLines

    return (
      <div ref={ref} className={cn('', className)} {...props}>
        <Accordion
          type="single"
          collapsible
          value={isExpanded ? 'thinking' : ''}
          onValueChange={(value) => setIsExpanded(value === 'thinking')}
        >
          <AccordionItem
            value="thinking"
            className={cn(
              'border rounded-xl overflow-hidden transition-all duration-300',
              isStreaming
                ? 'bg-linear-to-r from-muted/50 to-muted/30 border-muted-foreground/20'
                : 'bg-muted/30 border-border/50',
            )}
          >
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2.5">
                {isStreaming ? (
                  <div className="relative">
                    <Brain className="h-4 w-4 text-primary animate-pulse" />
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full animate-ping" />
                  </div>
                ) : (
                  <Brain className="h-4 w-4 text-muted-foreground" />
                )}
                <span
                  className={cn(
                    'text-sm font-medium transition-colors',
                    isStreaming ? 'text-primary' : 'text-muted-foreground',
                  )}
                >
                  {isStreaming ? 'Thinking...' : 'Reasoning'}
                </span>
              </div>
            </AccordionTrigger>

            {/* Preview when collapsed */}
            {!isExpanded && content && (
              <div className="px-4 pb-3 -mt-1">
                <pre className="text-xs font-mono text-muted-foreground/80 whitespace-pre-wrap line-clamp-4 leading-relaxed">
                  {previewContent}
                  {hasMoreContent && <span className="text-muted-foreground/50"> ...</span>}
                </pre>
              </div>
            )}

            <AccordionContent>
              <div
                ref={scrollRef}
                className="max-h-72 overflow-y-auto px-4 pb-4 scrollbar-thin scrollbar-thumb-muted-foreground/20"
              >
                <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {content}
                  {isStreaming && (
                    <span className="inline-flex items-center ml-1 gap-0.5">
                      <span
                        className="w-1 h-1 rounded-full bg-muted-foreground/50 animate-bounce"
                        style={{ animationDelay: '0ms' }}
                      />
                      <span
                        className="w-1 h-1 rounded-full bg-muted-foreground/50 animate-bounce"
                        style={{ animationDelay: '150ms' }}
                      />
                      <span
                        className="w-1 h-1 rounded-full bg-muted-foreground/50 animate-bounce"
                        style={{ animationDelay: '300ms' }}
                      />
                    </span>
                  )}
                </pre>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    )
  },
)
ThinkingAccordion.displayName = 'ThinkingAccordion'

export { ThinkingAccordion }
