import type { Message } from "@repo/ui";
import { useCallback, useEffect, useState } from "react";
import { config } from "../lib/config";

interface SessionEvent {
  eventId: string;
  role: "user" | "assistant";
  text: string;
  eventTimestamp?: string;
}

interface SessionEventsResponse {
  events: SessionEvent[];
}

/**
 * Fetch message history for a session from GET /sessions/:sessionId/events.
 * Returns messages sorted by eventTimestamp for display in the chat transcript.
 */
export function useSessionEvents(
  sessionId: string | null,
  getAuthToken?: () => Promise<string | null>,
) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!sessionId || !getAuthToken) {
      setMessages([]);
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        setMessages([]);
        return;
      }
      const url = config.agent.sessionEventsUrl(sessionId);
      const res = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        setMessages([]);
        return;
      }
      if (!res.ok) {
        throw new Error(`Failed to load session events: ${res.status}`);
      }
      const data = (await res.json()) as SessionEventsResponse;
      const list: Message[] = (data.events ?? [])
        .filter((e) => e.text?.trim())
        .sort(
          (a, b) =>
            new Date(a.eventTimestamp ?? 0).getTime() -
            new Date(b.eventTimestamp ?? 0).getTime(),
        )
        .map((e, i) => ({
          id: e.eventId || `evt-${i}`,
          role: e.role,
          content: e.text.trim(),
          timestamp: e.eventTimestamp
            ? new Date(e.eventTimestamp).getTime()
            : Date.now(),
        }));
      setMessages(list);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, getAuthToken]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return { messages, isLoading, error, refetch: fetchEvents };
}
