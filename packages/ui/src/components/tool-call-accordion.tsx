import { CheckCircle2, Loader2, Wrench, XCircle } from 'lucide-react'
import * as React from 'react'
import { cn } from '../lib/utils'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './accordion'
import { type TimelineEventStatus } from './timeline-event'

export interface ToolCallAccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  toolName: string
  input: unknown
  output?: unknown
  status: TimelineEventStatus
  duration?: number
}

/**
 * Format JSON for display
 */
function formatJson(data: unknown): string {
  try {
    return JSON.stringify(data, null, 2)
  } catch {
    return String(data)
  }
}

/**
 * Format duration in ms to human readable
 */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

const StatusIcon: React.FC<{ status: TimelineEventStatus }> = ({ status }) => {
  switch (status) {
    case 'running':
    case 'pending':
      return (
        <div className="relative">
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full animate-ping" />
        </div>
      )
    case 'completed':
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
    case 'failed':
      return <XCircle className="h-4 w-4 text-destructive" />
  }
}

const ToolCallAccordion = React.forwardRef<HTMLDivElement, ToolCallAccordionProps>(
  ({ className, toolName, input, output, status, duration, ...props }, ref) => {
    const [isExpanded, setIsExpanded] = React.useState(false)

    const statusLabel = React.useMemo(() => {
      switch (status) {
        case 'pending':
          return 'Pending'
        case 'running':
          return 'Running...'
        case 'completed':
          return duration ? `Completed in ${formatDuration(duration)}` : 'Completed'
        case 'failed':
          return 'Failed'
      }
    }, [status, duration])

    return (
      <div ref={ref} className={cn('', className)} {...props}>
        <Accordion
          type="single"
          collapsible
          value={isExpanded ? 'tool' : ''}
          onValueChange={(value) => setIsExpanded(value === 'tool')}
        >
          <AccordionItem
            value="tool"
            className={cn(
              'border rounded-xl overflow-hidden transition-all duration-300',
              status === 'running' || status === 'pending'
                ? 'bg-linear-to-r from-blue-500/5 to-blue-500/10 border-blue-500/20'
                : status === 'completed'
                  ? 'bg-card border-border/50'
                  : 'bg-destructive/5 border-destructive/20',
            )}
          >
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3 flex-1">
                <div
                  className={cn(
                    'flex items-center justify-center w-7 h-7 rounded-lg transition-colors',
                    status === 'running' || status === 'pending'
                      ? 'bg-blue-500/10'
                      : status === 'completed'
                        ? 'bg-emerald-500/10'
                        : 'bg-destructive/10',
                  )}
                >
                  <Wrench
                    className={cn(
                      'h-4 w-4',
                      status === 'running' || status === 'pending'
                        ? 'text-blue-500'
                        : status === 'completed'
                          ? 'text-emerald-500'
                          : 'text-destructive',
                    )}
                  />
                </div>
                <span className="text-sm font-medium">{toolName}</span>
                <div className="flex items-center gap-2 ml-auto mr-2">
                  <StatusIcon status={status} />
                  <span
                    className={cn(
                      'text-xs font-medium',
                      status === 'running' || status === 'pending'
                        ? 'text-blue-500'
                        : status === 'completed'
                          ? 'text-emerald-500'
                          : 'text-destructive',
                    )}
                  >
                    {statusLabel}
                  </span>
                </div>
              </div>
            </AccordionTrigger>

            <AccordionContent>
              <div className="px-4 pb-4 space-y-4">
                {/* Request */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Request</h4>
                  <div className="bg-muted/50 rounded-lg p-3 overflow-x-auto border border-border/30">
                    <pre className="text-xs font-mono text-foreground whitespace-pre-wrap leading-relaxed">
                      {formatJson(input)}
                    </pre>
                  </div>
                </div>

                {/* Result */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Result</h4>
                  <div
                    className={cn(
                      'rounded-lg p-3 overflow-x-auto border',
                      status === 'failed' ? 'bg-destructive/5 border-destructive/20' : 'bg-muted/50 border-border/30',
                    )}
                  >
                    {status === 'running' || status === 'pending' ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span className="text-xs">Waiting for result...</span>
                      </div>
                    ) : output !== undefined ? (
                      <pre className="text-xs font-mono text-foreground whitespace-pre-wrap leading-relaxed">
                        {formatJson(output)}
                      </pre>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No result</span>
                    )}
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    )
  },
)
ToolCallAccordion.displayName = 'ToolCallAccordion'

export { ToolCallAccordion }
