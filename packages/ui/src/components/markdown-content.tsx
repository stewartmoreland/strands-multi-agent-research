import * as React from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import type { PluggableList } from "unified";
import { cn } from "../lib/utils";

import "katex/dist/katex.min.css";

const remarkPlugins: PluggableList = [remarkGfm, remarkMath];
// Type assertion: rehype-katex's Plugin signature is stricter than unified's Pluggable at use site
const rehypePlugins = [
  rehypeHighlight,
  rehypeKatex,
  rehypeRaw,
] as PluggableList;

interface MermaidBlockProps {
  readonly code: string;
  readonly id: string;
}

function MermaidBlock({ code, id }: Readonly<MermaidBlockProps>) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el || !code) return;

    setError(null);
    el.innerHTML = "";
    const pre = document.createElement("pre");
    pre.className = "mermaid";
    pre.textContent = code;
    el.appendChild(pre);

    import("mermaid")
      .then((m) => {
        const mermaid = m.default;
        mermaid
          .run({
            nodes: [pre],
            suppressErrors: true,
          })
          .catch((err: unknown) => {
            setError(
              err instanceof Error ? err.message : "Failed to render diagram",
            );
          });
      })
      .catch(() => {
        setError("Mermaid failed to load");
      });
  }, [code, id]);

  if (error) {
    return (
      <pre
        className={cn(
          "rounded-md border border-destructive/30 bg-muted/50 p-3 text-sm",
        )}
      >
        <code>{code}</code>
        <div className="mt-2 text-destructive text-xs">{error}</div>
      </pre>
    );
  }

  return (
    <div
      ref={containerRef}
      className="[&>.mermaid]:min-h-[80px]"
      data-mermaid="true"
    />
  );
}

function useId(prefix: string): string {
  const idRef = React.useRef<string | null>(null);
  idRef.current ??= `${prefix}-${Math.random().toString(36).slice(2, 11)}`;
  return idRef.current;
}

interface CodeBlockProps extends React.HTMLAttributes<HTMLElement> {
  className?: string;
  children?: React.ReactNode;
  node?: unknown;
}

function CodeBlock({
  className,
  children,
  ...props
}: Readonly<CodeBlockProps>) {
  const id = useId("mermaid");
  const isMermaid = className?.includes("language-mermaid") ?? false;
  const code = String(children ?? "").trim();

  if (isMermaid) {
    return <MermaidBlock code={code} id={id} />;
  }

  return (
    <code className={className} {...props}>
      {children}
    </code>
  );
}

export interface MarkdownContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: string;
}

function PreBlock({
  children,
  ...props
}: React.HTMLAttributes<HTMLPreElement> & { children?: React.ReactNode }) {
  const child = React.Children.only(children);
  if (
    React.isValidElement(child) &&
    (child.props as { "data-mermaid"?: string })["data-mermaid"] === "true"
  ) {
    return <>{child}</>;
  }
  return <pre {...props}>{children}</pre>;
}

const MarkdownContent = React.forwardRef<HTMLDivElement, MarkdownContentProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "markdown-content prose prose-sm dark:prose-invert max-w-none",
          className,
        )}
        {...props}
      >
        <ReactMarkdown
          remarkPlugins={[...remarkPlugins]}
          rehypePlugins={[...rehypePlugins]}
          components={{
            code: CodeBlock,
            pre: PreBlock,
          }}
        >
          {children}
        </ReactMarkdown>
      </div>
    );
  },
);
MarkdownContent.displayName = "MarkdownContent";

export { MarkdownContent };
