/**
 * Shared structured logger for the research agent (OTEL-aware, CloudWatch-friendly).
 */
import { createLogger } from '@repo/util/logger'

export const logger = createLogger('research_agent')
