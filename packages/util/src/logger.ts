/**
 * Structured JSON logger with optional OpenTelemetry context injection.
 * Emits one JSON object per line for CloudWatch Logs Insights (timestamp, level,
 * message, service, session_id, trace_id, span_id when available).
 */

import { context, propagation, trace } from '@opentelemetry/api'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LoggerOptions {
  /** Default key-value attributes added to every log record */
  defaultAttributes?: Record<string, unknown>
}

export interface Logger {
  debug(message: string, attributes?: Record<string, unknown>): void
  info(message: string, attributes?: Record<string, unknown>): void
  warn(message: string, attributes?: Record<string, unknown>): void
  error(message: string, attributes?: Record<string, unknown>, err?: Error): void
}

const LOG_LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

function getOtelContext(): {
  trace_id?: string
  span_id?: string
  session_id?: string
} {
  const out: { trace_id?: string; span_id?: string; session_id?: string } = {}
  try {
    const ctx = context.active()
    const span = trace.getSpan(ctx)
    if (span) {
      const spanContext = span.spanContext()
      if (spanContext.traceId) out.trace_id = spanContext.traceId
      if (spanContext.spanId) out.span_id = spanContext.spanId
    }
    const baggage = propagation.getBaggage(ctx)
    if (baggage) {
      const sessionEntry = baggage.getEntry('session.id')
      if (sessionEntry?.value) out.session_id = sessionEntry.value
    }
  } catch {
    // OTEL not available or no active context
  }
  return out
}

function getMinLevel(): LogLevel {
  const env = (process.env.LOG_LEVEL ?? process.env.POWERTOOLS_LOG_LEVEL ?? 'info').toLowerCase()
  if (env === 'debug' || env === 'info' || env === 'warn' || env === 'error') return env
  return 'info'
}

/**
 * Create a structured logger that outputs JSON to stdout and optionally
 * injects trace_id, span_id, session_id from the active OpenTelemetry context.
 */
export function createLogger(serviceName: string, options: LoggerOptions = {}): Logger {
  const { defaultAttributes = {} } = options
  const minLevel = getMinLevel()
  const minOrder = LOG_LEVEL_ORDER[minLevel]

  function emit(level: LogLevel, message: string, attributes?: Record<string, unknown>, err?: Error): void {
    if (LOG_LEVEL_ORDER[level] < minOrder) return
    const record: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: serviceName,
      ...getOtelContext(),
      ...defaultAttributes,
      ...attributes,
    }
    if (err) {
      record.error = err.message
      if (err.stack) record.stack = err.stack
    }
    // One JSON line per log for CloudWatch
    process.stdout.write(JSON.stringify(record) + '\n')
  }

  return {
    debug(msg, attrs) {
      emit('debug', msg, attrs)
    },
    info(msg, attrs) {
      emit('info', msg, attrs)
    },
    warn(msg, attrs) {
      emit('warn', msg, attrs)
    },
    error(msg, attrs, err) {
      emit('error', msg, attrs, err)
    },
  }
}
