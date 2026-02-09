import type { UiEvent } from '@repo/shared/events'
import { isRunStartEvent } from '@repo/shared/events'
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
  type TranscriptItem,
} from '@repo/ui'
import { MoreHorizontal } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AppSidebar } from './components/AppSidebar'
import { useAuth } from './contexts/AuthContext'
import { useAgentStream } from './hooks/useAgentStream'
import { useBedrockModels } from './hooks/useBedrockModels'
import { useSessionEvents } from './hooks/useSessionEvents'
import { useSessions } from './hooks/useSessions'

function App() {
  const { user, getIdToken, getAccessToken } = useAuth()
  const { models: availableModels, isLoading: modelsLoading } = useBedrockModels()

  const {
    sessions: sessionsFromApi,
    refetch: refetchSessions,
    isLoading: sessionsLoading,
  } = useSessions({
    getAuthToken: getIdToken,
    enabled: !!user,
  })

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined') return true
    const stored = localStorage.getItem('theme')
    if (stored === 'light') return false
    if (stored === 'dark') return true
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode)
  }, [isDarkMode])
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [currentChatTitle, setCurrentChatTitle] = useState('New Chat')

  const SELECTED_MODEL_STORAGE_KEY = 'bedrock-selected-model-id'
  const [selectedModel, setSelectedModelState] = useState<string>(() => {
    if (typeof window === 'undefined') return ''
    return localStorage.getItem(SELECTED_MODEL_STORAGE_KEY) ?? ''
  })
  const setSelectedModel = useCallback((modelId: string) => {
    setSelectedModelState(modelId)
    try {
      localStorage.setItem(SELECTED_MODEL_STORAGE_KEY, modelId)
    } catch {
      // ignore quota / private mode
    }
  }, [])

  // When models load, ensure selection is valid; fallback to first model and persist
  useEffect(() => {
    if (availableModels.length === 0) return
    const isValid = availableModels.some((m) => m.id === selectedModel)
    if (!isValid) {
      const firstId = availableModels[0].id
      setSelectedModelState(firstId)
      try {
        localStorage.setItem(SELECTED_MODEL_STORAGE_KEY, firstId)
      } catch {
        // ignore
      }
    }
  }, [availableModels, selectedModel])

  const { events, isStreaming, error, run, reset, setSessionId } = useAgentStream({
    getAuthToken: getAccessToken,
    userId: user?.sub,
    modelId: selectedModel || undefined,
  })

  const { messages: sessionHistory } = useSessionEvents(selectedChatId, getIdToken)

  /**
   * Process the flat event stream into an ordered list of TranscriptItems.
   *
   * Events arrive in chronological order: thinking.delta, tool.start, tool.end,
   * message.delta, etc. We emit items in the same order they appear so that
   * thinking and tool-call accordions render inline between message chunks,
   * exactly like Cursor / v0.
   */
  const { transcriptItems } = useMemo(() => {
    // Split events by run boundary
    const segments: UiEvent[][] = []
    let current: UiEvent[] = []
    for (const event of events) {
      if (isRunStartEvent(event)) {
        if (current.length > 0) segments.push(current)
        current = []
      } else {
        current.push(event)
      }
    }
    if (current.length > 0) segments.push(current)

    const items: TranscriptItem[] = []
    let lastStreamingMsgId: string | undefined

    for (let s = 0; s < segments.length; s++) {
      const segment = segments[s]
      const tools: Map<string, ToolExecution> = new Map()
      let thinkingText = ''
      let thinkingId: string | null = null
      let messageText = ''
      let messageId: string | null = null

      // Walk through the segment events in chronological order
      for (const event of segment) {
        switch (event.type) {
          case 'thinking.delta': {
            // Start a new thinking block if we don't have one, or if we already
            // emitted message text (new thinking phase after a message chunk)
            if (!thinkingId) {
              thinkingId = `thinking-run-${s}`
              items.push({
                kind: 'thinking',
                id: thinkingId,
                content: '',
                isStreaming: false,
              })
            }
            thinkingText += event.text
            // Update the item in-place (the reference in the array)
            const thinkingItem = items.find((i) => i.kind === 'thinking' && i.id === thinkingId)
            if (thinkingItem && thinkingItem.kind === 'thinking') {
              thinkingItem.content = thinkingText
            }
            break
          }

          case 'tool.start': {
            // Flush any open thinking block (mark it as not streaming)
            if (thinkingId) {
              const ti = items.find((i) => i.kind === 'thinking' && i.id === thinkingId)
              if (ti && ti.kind === 'thinking') ti.isStreaming = false
            }

            const toolId = `tool-run-${s}-${event.toolName}-${tools.size}`
            const exec: ToolExecution = {
              id: toolId,
              toolName: event.toolName,
              input: event.input,
              status: 'running',
              startTime: Date.now(),
            }
            tools.set(toolId, exec)
            items.push({ kind: 'tool', id: toolId, execution: exec })
            break
          }

          case 'tool.end': {
            // Find the matching running tool (last one with this name)
            let matchId: string | null = null
            for (const [id, t] of tools) {
              if (t.toolName === event.toolName && t.status === 'running') {
                matchId = id
              }
            }
            if (matchId) {
              const exec = tools.get(matchId)!
              exec.output = event.output
              exec.status = 'completed'
              exec.endTime = Date.now()
            }
            break
          }

          case 'message.delta': {
            // Flush thinking
            if (thinkingId) {
              const ti = items.find((i) => i.kind === 'thinking' && i.id === thinkingId)
              if (ti && ti.kind === 'thinking') ti.isStreaming = false
              thinkingId = null
            }

            if (!messageId) {
              messageId = `msg-run-${s}`
              items.push({
                kind: 'message',
                id: messageId,
                message: {
                  id: messageId,
                  role: 'assistant',
                  content: '',
                  timestamp: Date.now(),
                },
                isStreaming: false,
              })
            }
            messageText += event.text
            const msgItem = items.find((i) => i.kind === 'message' && i.id === messageId)
            if (msgItem && msgItem.kind === 'message') {
              msgItem.message.content = messageText
            }
            lastStreamingMsgId = messageId
            break
          }

          default:
            break
        }
      }

      // After processing all segment events, mark the last thinking block as
      // streaming if we're in the latest segment and still streaming
      const isLatestSegment = s === segments.length - 1
      if (isLatestSegment && isStreaming && thinkingId) {
        const ti = items.find((i) => i.kind === 'thinking' && i.id === thinkingId)
        if (ti && ti.kind === 'thinking') ti.isStreaming = true
      }
      // Mark message as streaming if it's the latest segment
      if (isLatestSegment && isStreaming && messageId) {
        const mi = items.find((i) => i.kind === 'message' && i.id === messageId)
        if (mi && mi.kind === 'message') mi.isStreaming = true
      }
    }

    return {
      transcriptItems: items,
      streamingMessageId: isStreaming ? lastStreamingMsgId : undefined,
    }
  }, [events, isStreaming])

  // Track user messages separately
  const [userMessages, setUserMessages] = useState<Message[]>([])

  // Build the final ordered item list, merging user messages, session history,
  // and the streamed transcript items (which already interleave thinking/tools/messages).
  const allItems: TranscriptItem[] = useMemo(() => {
    // Convert session history into MessageItems
    const historyItems: TranscriptItem[] = (selectedChatId && sessionHistory.length > 0 ? sessionHistory : []).map(
      (m) => ({
        kind: 'message' as const,
        id: m.id,
        message: m,
        isStreaming: false,
      }),
    )

    // Convert user messages into MessageItems
    const userItems: TranscriptItem[] = userMessages.map((m) => ({
      kind: 'message' as const,
      id: m.id,
      message: m,
      isStreaming: false,
    }))

    // Interleave user messages with transcript items (thinking, tools, assistant messages)
    // Each user message is followed by the corresponding run's items.
    // transcriptItems already come from run segments, so we pair them up.
    const currentRunItems: TranscriptItem[] = []
    let transcriptIdx = 0

    for (let u = 0; u < userItems.length; u++) {
      currentRunItems.push(userItems[u])

      // Add all transcript items that belong to this run
      // (items between the current run start and the next user message's run)
      while (transcriptIdx < transcriptItems.length) {
        const item = transcriptItems[transcriptIdx]
        // Check if this item's run index matches (run ids are like `*-run-{s}-*`)
        const runMatch = item.id.match(/run-(\d+)/)
        const runIdx = runMatch ? parseInt(runMatch[1], 10) : 0
        if (runIdx <= u) {
          currentRunItems.push(item)
          transcriptIdx++
        } else {
          break
        }
      }
    }

    // Add any remaining transcript items (e.g. if assistant is still streaming)
    while (transcriptIdx < transcriptItems.length) {
      currentRunItems.push(transcriptItems[transcriptIdx])
      transcriptIdx++
    }

    return [...historyItems, ...currentRunItems]
  }, [userMessages, transcriptItems, selectedChatId, sessionHistory])

  // Derive allMessages for the message count display
  const allMessages = useMemo(() => {
    return allItems.filter((i): i is TranscriptItem & { kind: 'message' } => i.kind === 'message').map((i) => i.message)
  }, [allItems])

  const handleSend = useCallback(
    async (content: string) => {
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content,
        timestamp: Date.now(),
      }
      setUserMessages((prev) => [...prev, userMessage])

      if (userMessages.length === 0) {
        setCurrentChatTitle(content.slice(0, 30) + (content.length > 30 ? '...' : ''))
      }

      await run(content)
      refetchSessions()
    },
    [run, userMessages.length, refetchSessions],
  )

  const handleNewChat = useCallback(() => {
    setSessionId(null)
    reset()
    setUserMessages([])
    setSelectedChatId(null)
    setCurrentChatTitle('New Chat')
    refetchSessions()
  }, [setSessionId, reset, refetchSessions])

  const handleSelectChat = useCallback(
    (chatId: string) => {
      setSelectedChatId(chatId)
      setSessionId(chatId)
      reset()
      setUserMessages([])
      const chat = sessionsFromApi.find((c) => c.id === chatId)
      if (chat) {
        setCurrentChatTitle(chat.title)
      }
    },
    [sessionsFromApi, setSessionId, reset],
  )

  const toggleTheme = useCallback(() => {
    setIsDarkMode((prev) => {
      const next = !prev
      localStorage.setItem('theme', next ? 'dark' : 'light')
      return next
    })
  }, [])

  // Calculate current chat metadata
  const chatUpdatedTime = useMemo(() => {
    if (allMessages.length === 0) return 'Just now'
    const lastMessage = allMessages.at(-1)
    if (!lastMessage?.timestamp) return 'Just now'
    const seconds = Math.floor((Date.now() - lastMessage.timestamp) / 1000)
    if (seconds < 60) return `${seconds} second${seconds === 1 ? '' : 's'} ago`
    const minutes = Math.floor(seconds / 60)
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  }, [allMessages])

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
            <h1 className="text-xl font-semibold tracking-tight">{currentChatTitle}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Updated {chatUpdatedTime} · {allMessages.length} message
              {allMessages.length === 1 ? '' : 's'}
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
            <ChatTranscript items={allItems} className="h-full" />
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
              <p className="text-xs text-muted-foreground">AI can make mistakes. Check important info.</p>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default App
