import { useCallback, useEffect, useState } from 'react'
import { config } from '../lib/config'

export interface SessionEntry {
  id: string
  title: string
  timestamp: Date
  messageCount: number
}

interface SessionsResponse {
  sessions: {
    id: string
    createdAt: string
    title?: string
    messageCount?: number
  }[]
}

/**
 * Fetch chat sessions from the agent GET /sessions endpoint.
 * Requires getAuthToken to be provided when user is authenticated.
 */
export function useSessions(options: { getAuthToken?: () => Promise<string | null>; enabled?: boolean }) {
  const { getAuthToken, enabled = true } = options
  const [sessions, setSessions] = useState<SessionEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSessions = useCallback(async () => {
    if (!getAuthToken || !enabled) {
      setSessions([])
      return
    }
    setError(null)
    setIsLoading(true)
    try {
      const token = await getAuthToken()
      if (!token) {
        setSessions([])
        return
      }
      const url = config.agent.sessionsUrl
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (res.status === 401) {
        setSessions([])
        return
      }
      if (!res.ok) {
        throw new Error(`Failed to load sessions: ${res.status}`)
      }
      const data = (await res.json()) as SessionsResponse
      const list: SessionEntry[] = (data.sessions ?? []).map((s) => ({
        id: s.id,
        title: s.title ?? `Chat from ${formatSessionDate(s.createdAt)}`,
        timestamp: new Date(s.createdAt),
        messageCount: s.messageCount ?? 0,
      }))
      list.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      setSessions(list)
    } catch (err) {
      const message =
        err instanceof TypeError && err.message === 'Failed to fetch'
          ? 'Could not reach the Research API. Is the API server running? (Start with `yarn workspace api dev` or `yarn dev` from the repo root.)'
          : err instanceof Error
            ? err.message
            : 'Unknown error'
      setError(message)
      setSessions([])
    } finally {
      setIsLoading(false)
    }
  }, [getAuthToken, enabled])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  return { sessions, isLoading, error, refetch: fetchSessions }
}

function formatSessionDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const sameDay =
    d.getUTCDate() === now.getUTCDate() &&
    d.getUTCMonth() === now.getUTCMonth() &&
    d.getUTCFullYear() === now.getUTCFullYear()
  if (sameDay) {
    return d.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    })
  }
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (
    d.getUTCDate() === yesterday.getUTCDate() &&
    d.getUTCMonth() === yesterday.getUTCMonth() &&
    d.getUTCFullYear() === yesterday.getUTCFullYear()
  ) {
    return 'Yesterday'
  }
  const showYear = d.getUTCFullYear() === now.getUTCFullYear() ? undefined : 'numeric'
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: showYear,
  })
}
