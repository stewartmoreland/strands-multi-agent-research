import { Loader2, Send } from "lucide-react";
import * as React from "react";
import { cn } from "../lib/utils";
import { Button } from "./button";
import { Textarea } from "./textarea";

export interface ChatInputProps extends Omit<
  React.HTMLAttributes<HTMLFormElement>,
  "onSubmit"
> {
  onSend: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

const ChatInput = React.forwardRef<HTMLFormElement, ChatInputProps>(
  (
    {
      className,
      onSend,
      isLoading = false,
      placeholder = "Type your message...",
      ...props
    },
    ref,
  ) => {
    const [value, setValue] = React.useState("");
    const inputRef = React.useRef<HTMLInputElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = value.trim();
      if (trimmed && !isLoading) {
        onSend(trimmed);
        setValue("");
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    };

    // Focus input on mount
    React.useEffect(() => {
      inputRef.current?.focus();
    }, []);

    return (
      <form
        ref={ref}
        onSubmit={handleSubmit}
        className={cn("flex items-center gap-3", className)}
        {...props}
      >
        <div className="relative flex-1">
          <Textarea
            ref={inputRef as React.Ref<HTMLTextAreaElement>}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            className={cn(
              "min-h-12 pr-12 rounded-xl bg-muted/50 border-muted-foreground/20",
              "placeholder:text-muted-foreground/60 resize-none",
              "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-ring/50 dark:bg-input/30",
              "transition-all duration-200",
            )}
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !value.trim()}
            className={cn(
              "absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 rounded-lg",
              "transition-all duration-200",
              value.trim() && !isLoading
                ? "bg-primary text-primary-foreground shadow-sm hover:shadow-md"
                : "bg-muted text-muted-foreground",
            )}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="sr-only">Send message</span>
          </Button>
        </div>
      </form>
    );
  },
);
ChatInput.displayName = "ChatInput";

export { ChatInput };
