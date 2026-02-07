import type { UiEvent } from "@repo/shared/events";
import { isRunStartEvent } from "@repo/shared/events";
import {
  Button,
  ChatInput,
  ChatTranscript,
  ModelSelector,
  Separator,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  type Message,
  type ToolExecution,
} from "@repo/ui";
import { MoreHorizontal } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppSidebar } from "./components/AppSidebar";
import { useAuth } from "./contexts/AuthContext";
import { useAgentStream } from "./hooks/useAgentStream";
import { useBedrockModels } from "./hooks/useBedrockModels";
import { useSessionEvents } from "./hooks/useSessionEvents";
import { useSessions } from "./hooks/useSessions";

function App() {
  const { user, getIdToken } = useAuth();
  const { models: availableModels, isLoading: modelsLoading } = useBedrockModels();

  const {
    sessions: sessionsFromApi,
    refetch: refetchSessions,
    isLoading: sessionsLoading,
  } = useSessions({
    getAuthToken: getIdToken,
    enabled: !!user,
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem("theme");
    if (stored === "light") return false;
    if (stored === "dark") return true;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [currentChatTitle, setCurrentChatTitle] = useState("New Chat");

  const SELECTED_MODEL_STORAGE_KEY = "bedrock-selected-model-id";
  const [selectedModel, setSelectedModelState] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(SELECTED_MODEL_STORAGE_KEY) ?? "";
  });
  const setSelectedModel = useCallback((modelId: string) => {
    setSelectedModelState(modelId);
    try {
      localStorage.setItem(SELECTED_MODEL_STORAGE_KEY, modelId);
    } catch {
      // ignore quota / private mode
    }
  }, []);

  // When models load, ensure selection is valid; fallback to first model and persist
  useEffect(() => {
    if (availableModels.length === 0) return;
    const isValid = availableModels.some((m) => m.id === selectedModel);
    if (!isValid) {
      const firstId = availableModels[0].id;
      setSelectedModelState(firstId);
      try {
        localStorage.setItem(SELECTED_MODEL_STORAGE_KEY, firstId);
      } catch {
        // ignore
      }
    }
  }, [availableModels, selectedModel]);

  const { events, isStreaming, error, run, reset, setSessionId } =
    useAgentStream({
      getAuthToken: getIdToken,
      userId: user?.sub,
      modelId: selectedModel || undefined,
    });

  const { messages: sessionHistory } = useSessionEvents(
    selectedChatId,
    getIdToken,
  );

  // Process events: one assistant message per run (collapse multiple message.done from backend)
  const { messages, toolExecutions, thinkingContent, streamingMessageId } =
    useMemo(() => {
      const tools: Map<string, ToolExecution> = new Map();
      let thinking = "";

      // Split events by run boundary so we get one assistant message per invocation
      const segments: UiEvent[][] = [];
      let current: UiEvent[] = [];
      for (const event of events) {
        if (isRunStartEvent(event)) {
          if (current.length > 0) segments.push(current);
          current = [];
        } else {
          current.push(event);
        }
      }
      if (current.length > 0) segments.push(current);

      const msgs: Message[] = [];
      for (let s = 0; s < segments.length; s++) {
        const segment = segments[s];
        let content = "";
        for (const e of segment) {
          if (e.type === "message.delta") content += e.text;
        }
        if (content.trim()) {
          msgs.push({
            id: `msg-run-${s}`,
            role: "assistant",
            content: content.trim(),
            timestamp: Date.now(),
          });
        }
      }

      // Tools and thinking from the latest segment (current run)
      const latest = segments.at(-1) ?? [];
      for (const event of latest) {
        switch (event.type) {
          case "thinking.delta":
            thinking += event.text;
            break;
          case "tool.start":
            tools.set(event.toolName, {
              id: `tool-${Date.now()}-${event.toolName}`,
              toolName: event.toolName,
              input: event.input,
              status: "running",
              startTime: Date.now(),
            });
            break;
          case "tool.end": {
            const existing = tools.get(event.toolName);
            if (existing) {
              tools.set(event.toolName, {
                ...existing,
                output: event.output,
                status: "completed",
                endTime: Date.now(),
              });
            }
            break;
          }
          default:
            break;
        }
      }

      const lastSegment = segments.at(-1) ?? [];
      let streamingContent = "";
      for (const e of lastSegment) {
        if (e.type === "message.delta") streamingContent += e.text;
      }

      return {
        messages: msgs,
        toolExecutions: Array.from(tools.values()),
        thinkingContent: thinking,
        streamingMessageId:
          isStreaming && streamingContent && segments.length > 0
            ? `msg-run-${segments.length - 1}`
            : undefined,
      };
    }, [events, isStreaming]);

  // Track user messages separately
  const [userMessages, setUserMessages] = useState<Message[]>([]);

  // Combine: when viewing a session, show loaded history + current run; otherwise current run only
  const allMessages = useMemo(() => {
    const combined = [...userMessages];
    let assistantIndex = 0;
    for (
      let i = 0;
      i < combined.length && assistantIndex < messages.length;
      i++
    ) {
      if (combined[i].role === "user") {
        if (assistantIndex < messages.length) {
          combined.splice(i + 1, 0, messages[assistantIndex]);
          assistantIndex++;
          i++;
        }
      }
    }
    while (assistantIndex < messages.length) {
      combined.push(messages[assistantIndex]);
      assistantIndex++;
    }
    const currentRun = combined;
    if (selectedChatId && sessionHistory.length > 0) {
      return [...sessionHistory, ...currentRun];
    }
    return currentRun;
  }, [userMessages, messages, selectedChatId, sessionHistory]);

  const handleSend = useCallback(
    async (content: string) => {
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content,
        timestamp: Date.now(),
      };
      setUserMessages((prev) => [...prev, userMessage]);

      if (userMessages.length === 0) {
        setCurrentChatTitle(
          content.slice(0, 30) + (content.length > 30 ? "..." : ""),
        );
      }

      await run(content);
      refetchSessions();
    },
    [run, userMessages.length, refetchSessions],
  );

  const handleNewChat = useCallback(() => {
    setSessionId(null);
    reset();
    setUserMessages([]);
    setSelectedChatId(null);
    setCurrentChatTitle("New Chat");
    refetchSessions();
  }, [setSessionId, reset, refetchSessions]);

  const handleSelectChat = useCallback(
    (chatId: string) => {
      setSelectedChatId(chatId);
      setSessionId(chatId);
      reset();
      setUserMessages([]);
      const chat = sessionsFromApi.find((c) => c.id === chatId);
      if (chat) {
        setCurrentChatTitle(chat.title);
      }
    },
    [sessionsFromApi, setSessionId, reset],
  );

  const toggleTheme = useCallback(() => {
    setIsDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem("theme", next ? "dark" : "light");
      return next;
    });
  }, []);

  // Calculate current chat metadata
  const chatUpdatedTime = useMemo(() => {
    if (allMessages.length === 0) return "Just now";
    const lastMessage = allMessages.at(-1);
    if (!lastMessage?.timestamp) return "Just now";
    const seconds = Math.floor((Date.now() - lastMessage.timestamp) / 1000);
    if (seconds < 60) return `${seconds} second${seconds === 1 ? "" : "s"} ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }, [allMessages]);

  return (
    <SidebarProvider>
      <AppSidebar
        chatHistory={sessionsFromApi}
        sessionsLoading={sessionsLoading}
        selectedChatId={selectedChatId}
        isStreaming={isStreaming}
        isDarkMode={isDarkMode}
        user={user}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content */}
      <SidebarInset>
        {/* Header */}
        <header className="bg-background sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <div className="flex flex-1 items-center gap-2">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <ModelSelector
              models={availableModels}
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              disabled={isStreaming || modelsLoading}
            />
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">More options</span>
          </Button>
        </header>

        {/* Main scrollable area */}
        <div className="flex flex-1 flex-col min-h-0">
          {/* Chat Title + Metadata */}
          <div className="shrink-0 px-6 py-4 border-b">
            <h1 className="text-xl font-semibold tracking-tight">
              {currentChatTitle}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Updated {chatUpdatedTime} · {allMessages.length} message
              {allMessages.length === 1 ? "" : "s"}
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="shrink-0 px-4 py-2 bg-destructive/10 border-b border-destructive/20 animate-in fade-in slide-in-from-top-2 duration-300">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Chat transcript with inline thinking and tools */}
          <div className="flex-1 overflow-hidden">
            <ChatTranscript
              messages={allMessages}
              streamingMessageId={streamingMessageId ?? undefined}
              thinkingContent={thinkingContent}
              isThinkingStreaming={isStreaming && !!thinkingContent}
              toolExecutions={toolExecutions}
              className="h-full"
            />
          </div>

          {/* Chat input area */}
          <div className="shrink-0 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
            <div className="mx-auto max-w-3xl px-4 py-4">
              <ChatInput
                onSend={handleSend}
                isLoading={isStreaming}
                placeholder="How can I help you today?"
                className="border-0 p-0 bg-transparent"
              />
            </div>
            {/* Footer disclaimer */}
            <div className="pb-3 text-center">
              <p className="text-xs text-muted-foreground">
                AI can make mistakes. Check important info.
              </p>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default App;
