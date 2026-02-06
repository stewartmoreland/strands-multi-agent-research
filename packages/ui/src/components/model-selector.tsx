import { ChevronDown, Sparkles } from "lucide-react";
import * as React from "react";
import { cn } from "../lib/utils";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

export interface ModelOption {
  id: string;
  name: string;
  description?: string;
  icon?: React.ReactNode;
}

export interface ModelSelectorProps extends React.HTMLAttributes<HTMLDivElement> {
  models: ModelOption[];
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  disabled?: boolean;
}

const ModelSelector = React.forwardRef<HTMLDivElement, ModelSelectorProps>(
  (
    {
      className,
      models,
      selectedModel,
      onModelChange,
      disabled = false,
      ...props
    },
    ref,
  ) => {
    const currentModel =
      models.find((m) => m.id === selectedModel) || models[0];

    return (
      <div ref={ref} className={cn("inline-flex", className)} {...props}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild disabled={disabled}>
            <Button
              variant="ghost"
              className="gap-2 px-3 py-2 h-auto font-medium"
              disabled={disabled}
            >
              {currentModel?.icon || (
                <Sparkles className="h-4 w-4 text-primary" />
              )}
              <span>{currentModel?.name || "Select Model"}</span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {models.map((model) => (
              <DropdownMenuItem
                key={model.id}
                onClick={() => onModelChange(model.id)}
                className={cn(
                  "flex flex-col items-start gap-0.5 py-2",
                  model.id === selectedModel && "bg-accent",
                )}
              >
                <div className="flex items-center gap-2">
                  {model.icon || <Sparkles className="h-4 w-4" />}
                  <span className="font-medium">{model.name}</span>
                </div>
                {model.description && (
                  <span className="text-xs text-muted-foreground ml-6">
                    {model.description}
                  </span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  },
);
ModelSelector.displayName = "ModelSelector";

export { ModelSelector };
