import { ChevronDown, Sparkles } from 'lucide-react'
import * as React from 'react'
import { cn } from '../lib/utils'
import { Badge } from './badge'
import { Button } from './button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './dropdown-menu'

export interface ModelOption {
  id: string
  name: string
  description?: string
  icon?: React.ReactNode
  /** For Bedrock: show streaming badge when true */
  responseStreamingSupported?: boolean
  /** For Bedrock: e.g. ["TEXT", "IMAGE"] */
  outputModalities?: string[]
  /** For Bedrock: e.g. ["ON_DEMAND", "PROVISIONED"] */
  inferenceTypesSupported?: string[]
}

export interface ModelSelectorProps extends React.HTMLAttributes<HTMLDivElement> {
  models: ModelOption[]
  selectedModel: string
  onModelChange: (modelId: string) => void
  disabled?: boolean
}

/** Group models by provider (description); unknown provider key for missing description */
function groupModelsByProvider(models: ModelOption[]): Map<string, ModelOption[]> {
  const map = new Map<string, ModelOption[]>()
  for (const m of models) {
    const key = m.description?.trim() || 'Other'
    const list = map.get(key) ?? []
    list.push(m)
    map.set(key, list)
  }
  return map
}

function ModelBadges({ model }: { model: ModelOption }) {
  const badges: React.ReactNode[] = []
  if (model.responseStreamingSupported) {
    badges.push(
      <Badge key="streaming" variant="secondary" className="text-[10px]">
        Streaming
      </Badge>,
    )
  }
  if (model.outputModalities?.length) {
    model.outputModalities.forEach((mod) => {
      badges.push(
        <Badge key={`mod-${mod}`} variant="outline" className="text-[10px]">
          {mod}
        </Badge>,
      )
    })
  }
  if (model.inferenceTypesSupported?.length) {
    model.inferenceTypesSupported.forEach((type) => {
      badges.push(
        <Badge key={`inf-${type}`} variant="ghost" className="text-[10px]">
          {type.replace('_', ' ')}
        </Badge>,
      )
    })
  }
  if (badges.length === 0) return null
  return <div className="flex flex-wrap gap-1 mt-1">{badges}</div>
}

const ModelSelector = React.forwardRef<HTMLDivElement, ModelSelectorProps>(
  ({ className, models, selectedModel, onModelChange, disabled = false, ...props }, ref) => {
    const currentModel = models.find((m) => m.id === selectedModel) || models[0]
    const byProvider = React.useMemo(() => groupModelsByProvider(models), [models])
    const providerNames = React.useMemo(
      () => Array.from(byProvider.keys()).sort((a, b) => a.localeCompare(b)),
      [byProvider],
    )
    const hasSubmenus = providerNames.length > 1

    return (
      <div ref={ref} className={cn('inline-flex', className)} {...props}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild disabled={disabled}>
            <Button variant="ghost" className="gap-2 px-3 py-2 h-auto font-medium" disabled={disabled}>
              {currentModel?.icon || <Sparkles className="h-4 w-4 text-primary" />}
              <span>{currentModel?.name || 'Select Model'}</span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[20rem] max-w-[28rem]">
            {hasSubmenus
              ? providerNames.map((provider) => (
                  <DropdownMenuSub key={provider}>
                    <DropdownMenuSubTrigger>{provider}</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="min-w-[18rem] max-w-[26rem]">
                      {(byProvider.get(provider) ?? []).map((model) => (
                        <DropdownMenuItem
                          key={model.id}
                          onClick={() => onModelChange(model.id)}
                          className={cn(
                            'flex flex-col items-start gap-0.5 py-2',
                            model.id === selectedModel && 'bg-accent',
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {model.icon || <Sparkles className="h-4 w-4 shrink-0" />}
                            <span className="font-medium">{model.name}</span>
                          </div>
                          <ModelBadges model={model} />
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                ))
              : models.map((model) => (
                  <DropdownMenuItem
                    key={model.id}
                    onClick={() => onModelChange(model.id)}
                    className={cn('flex flex-col items-start gap-0.5 py-2', model.id === selectedModel && 'bg-accent')}
                  >
                    <div className="flex items-center gap-2">
                      {model.icon || <Sparkles className="h-4 w-4 shrink-0" />}
                      <span className="font-medium">{model.name}</span>
                    </div>
                    <ModelBadges model={model} />
                  </DropdownMenuItem>
                ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  },
)
ModelSelector.displayName = 'ModelSelector'

export { ModelSelector }
