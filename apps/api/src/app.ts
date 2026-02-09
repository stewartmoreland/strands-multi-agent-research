/**
 * Express app for Research Agent API.
 * GET /models, GET /sessions, GET /sessions/:sessionId/events.
 * No /invocations (frontend calls AgentCore directly for SSE).
 */

import { listFoundationModels, memoryAdapter } from '@repo/util'
import type { NextFunction, Request, Response } from 'express'
import express from 'express'
import { randomUUID } from 'node:crypto'
import { getActorIdFromToken } from './jwt'
import { logger } from './logger'

const app = express()
app.use(express.json())

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization',
}

app.use((req: Request, res: Response, next: NextFunction) => {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v))
  if (req.method === 'OPTIONS') {
    res.sendStatus(204)
    return
  }
  next()
})

// Request ID and structured logging: append request_id for CloudWatch correlation
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = (req.headers['x-request-id'] as string) ?? randomUUID()
  res.setHeader('X-Request-Id', requestId)
  logger.appendKeys({ request_id: requestId })
  next()
})

// Request completion logging (structured for CloudWatch Logs Insights)
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now()
  res.on('finish', () => {
    const duration_ms = Date.now() - start
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      status_code: res.statusCode,
      duration_ms,
    })
  })
  next()
})

function getBearerToken(req: Request): string | null {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return null
  return auth.slice(7).trim()
}

app.get('/models', async (_req, res: Response) => {
  try {
    const models = await listFoundationModels()
    res.json({ models })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const stack = err instanceof Error ? err.stack : undefined
    logger.error('GET /models failed', { error: message, stack })
    const body: { error: string; detail?: string } = {
      error: 'Failed to list models',
    }
    if (process.env.NODE_ENV !== 'production') body.detail = message
    res.status(500).json(body)
  }
})

app.get('/sessions', async (req: Request, res: Response) => {
  const token = getBearerToken(req)
  if (!token) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }
  const actorId = getActorIdFromToken(token)
  if (!actorId) {
    res.status(401).json({ error: 'Invalid token' })
    return
  }
  try {
    const list = await memoryAdapter.listSessions(actorId)
    const sessions = await Promise.all(
      list.map(async (s) => {
        const events = await memoryAdapter.listEvents(actorId, s.sessionId, {
          maxResults: 100,
          includePayloads: false,
        })
        const title = events.find((e) => e.role === 'assistant')?.text
        return {
          id: s.sessionId,
          createdAt: s.createdAt.toISOString(),
          title,
          messageCount: events.length,
        }
      }),
    )
    res.json({ sessions })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const stack = err instanceof Error ? err.stack : undefined
    logger.error('GET /sessions failed', { error: message, stack })
    const body: { error: string; detail?: string } = {
      error: 'Failed to list sessions',
    }
    if (process.env.NODE_ENV !== 'production') body.detail = message
    res.status(500).json(body)
  }
})

app.get('/sessions/:sessionId/events', async (req: Request, res: Response) => {
  const token = getBearerToken(req)
  if (!token) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }
  const actorId = getActorIdFromToken(token)
  if (!actorId) {
    res.status(401).json({ error: 'Invalid token' })
    return
  }
  const sessionId = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId
  if (!sessionId) {
    res.status(400).json({ error: 'Session ID required' })
    return
  }

  logger.appendKeys({ session_id: sessionId })

  try {
    const eventsResponse = await memoryAdapter.listEvents(actorId, sessionId, {
      maxResults: 100,
      includePayloads: true,
    })
    const events = eventsResponse.map((e) => ({
      eventId: e.eventId,
      role: normalizeRole(e.role),
      text: e.text ?? '',
      eventTimestamp: e.eventTimestamp?.toISOString(),
    }))
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    })
    res.end(JSON.stringify({ events }))
  } catch (error) {
    logger.error('GET /sessions/:sessionId/events failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    res.writeHead(500, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    })
    res.end(JSON.stringify({ error: 'Failed to list sessions' }))
  }
})

function normalizeRole(role: string | undefined): 'user' | 'assistant' {
  if (!role) return 'assistant'
  const r = role.toUpperCase()
  if (r === 'USER') return 'user'
  return 'assistant'
}

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' })
})

export default app
