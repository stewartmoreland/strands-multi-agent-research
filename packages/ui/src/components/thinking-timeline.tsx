import * as React from 'react'
import { cn } from '../lib/utils'
import { ScrollArea } from './scroll-area'
import { TimelineEvent, type TimelineEventStatus } from './timeline-event'

export interface ToolExecution {
  id: string
  toolName: string
  input?: unknown
  output?: unknown
  status: TimelineEventStatus
  startTime: number
  endTime?: number
}

export interface ThinkingTimelineProps extends React.HTMLAttributes<HTMLDivElement> {
  executions: ToolExecution[]
  title?: string
}

const ThinkingTimeline = React.forwardRef<HTMLDivElement, ThinkingTimelineProps>(
  ({ className, executions, title = 'Agent Activity', ...props }, ref) => {
    const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set())

    const toggleExpanded = (id: string) => {
      setExpandedIds((prev) => {
        const next = new Set(prev)
        if (next.has(id)) {
          next.delete(id)
        } else {
          next.add(id)
        }
        return next
      })
    }

    return (
      <div ref={ref} className={cn('flex flex-col h-full', className)} {...props}>
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-sm">{title}</h3>
          <span className="text-xs text-muted-foreground">{executions.length} events</span>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4">
            {executions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <p className="text-sm">No activity yet</p>
                <p className="text-xs">Tool executions will appear here</p>
              </div>
            ) : (
              executions.map((execution) => (
                <TimelineEvent
                  key={execution.id}
                  toolName={execution.toolName}
                  status={execution.status}
                  input={execution.input}
                  output={execution.output}
                  startTime={execution.startTime}
                  endTime={execution.endTime}
                  isExpanded={expandedIds.has(execution.id)}
                  onToggle={() => toggleExpanded(execution.id)}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    )
  },
)
ThinkingTimeline.displayName = 'ThinkingTimeline'

export { ThinkingTimeline }
