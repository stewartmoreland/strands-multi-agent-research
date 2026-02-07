import type { UiEvent } from "@repo/shared/events";
import { useCallback, useRef, useState } from "react";

/**
 * Default endpoint from environment variable or fallback to local proxy
 * - For local development: '/api/invocations' (proxied through Vite to localhost:8080)
 * - For production: Full AgentCore Runtime URL (e.g., https://bedrock-agentcore.{region}.amazonaws.com/runtimes/{runtimeId}/invocations)
 */
const DEFAULT_ENDPOINT =
  import.meta.env.VITE_AGENT_INVOCATIONS_URL || "/api/invocations";

interface UseAgentStreamOptions {
  /** Custom endpoint URL (defaults to VITE_AGENT_INVOCATIONS_URL or '/api/invocations') */
  endpoint?: string;
  /** Function to get auth token for production AgentCore calls */
  getAuthToken?: () => Promise<string | null>;
  /** User ID for memory/personalization */
  userId?: string;
  /** Bedrock model ID for this session (sent with each invocation) */
  modelId?: string;
}

interface UseAgentStreamReturn {
  events: UiEvent[];
  isStreaming: boolean;
  error: string | null;
  sessionId: string | null;
  setSessionId: (id: string | null) => void;
  run: (prompt: string) => Promise<void>;
  reset: () => void;
}

/**
 * Hook for streaming events from the agent runtime
 * Handles SSE parsing, authentication, and state management
 *
 * @example
 * // Local development (uses Vite proxy)
 * const { run, events, isStreaming } = useAgentStream();
 *
 * @example
 * // Production with authentication
 * const { getIdToken } = useAuth();
 * const { run, events, isStreaming } = useAgentStream({
 *   getAuthToken: getIdToken,
 *   userId: user?.sub,
 * });
 */
export function useAgentStream(
  options: UseAgentStreamOptions = {},
): UseAgentStreamReturn {
  const { endpoint = DEFAULT_ENDPOINT, getAuthToken, userId, modelId } = options;

  const [events, setEvents] = useState<UiEvent[]>([]);
  const [isStreaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    // Abort any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setEvents([]);
    setStreaming(false);
    setError(null);
  }, []);

  const run = useCallback(
    async (prompt: string) => {
      setError(null);
      setStreaming(true);
      // Boundary so the UI can collapse one assistant message per run
      setEvents((prev) => [...prev, { type: "run.start" }]);

      abortControllerRef.current = new AbortController();

      try {
        // Build headers
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        };

        // Add authorization header for production if auth token is available
        if (getAuthToken) {
          try {
            const token = await getAuthToken();
            if (token) {
              headers["Authorization"] = `Bearer ${token}`;
            }
          } catch (authError) {
            console.warn("Failed to get auth token:", authError);
          }
        }

        const response = await fetch(endpoint, {
          method: "POST",
          headers,
          body: JSON.stringify({
            prompt,
            sessionId: sessionId || undefined,
            userId: userId || undefined,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          // Handle specific error codes
          if (response.status === 401) {
            throw new Error("Authentication required. Please sign in.");
          }
          if (response.status === 403) {
            throw new Error("Access denied. Please check your permissions.");
          }
          throw new Error(`HTTP error: ${response.status}`);
        }

        if (!response.body) {
          throw new Error("No response body");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let buffer = "";
        let done = false;

        while (!done) {
          const result = await reader.read();
          done = result.done;
          if (done) break;
          const value = result.value;

          buffer += decoder.decode(value, { stream: true });

          // Parse SSE events (split on double newline)
          const parts = buffer.split("\n\n");
          buffer = parts.pop() ?? "";

          for (const part of parts) {
            // Find the data line
            const dataLine = part
              .split("\n")
              .find((line) => line.startsWith("data: "));

            if (!dataLine) continue;

            const jsonStr = dataLine.slice("data: ".length);
            try {
              const event = JSON.parse(jsonStr) as UiEvent;

              // Handle meta event to capture session ID
              if (event.type === "meta") {
                setSessionId(event.sessionId);
              }

              // Handle error event
              if (event.type === "error") {
                setError(event.message);
              }

              // Add event to list
              setEvents((prev) => [...prev, event]);
            } catch (parseError) {
              console.warn("Failed to parse SSE event:", jsonStr);
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // Request was aborted, don't set error
          return;
        }
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
      } finally {
        setStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [endpoint, sessionId, getAuthToken, userId, modelId],
  );

  return {
    events,
    isStreaming,
    error,
    sessionId,
    setSessionId,
    run,
    reset,
  };
}
