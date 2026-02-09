/**
 * Application configuration from environment variables
 */
export const config = {
  cognito: {
    userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || '',
    clientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '',
    region: import.meta.env.VITE_COGNITO_REGION || 'us-east-1',
  },
  agent: {
    /** URL for POST /invocations (SSE). Built from ARN+region when set, else VITE_AGENT_INVOCATIONS_URL or local. */
    get invocationsUrl(): string {
      const arn = import.meta.env.VITE_AGENT_RUNTIME_ARN
      const region = import.meta.env.VITE_COGNITO_REGION || 'us-east-1'
      if (arn) {
        return `https://bedrock-agentcore.${region}.amazonaws.com/runtimes/${encodeURIComponent(arn)}/invocations`
      }
      return import.meta.env.VITE_AGENT_INVOCATIONS_URL || 'http://localhost:8080/agent/invocations'
    },
    /** Base URL for API (models, sessions). No invocations. */
    apiUrl: import.meta.env.VITE_AGENT_API_URL || '/api',
    /** GET /sessions - list chat sessions */
    get sessionsUrl() {
      const base = import.meta.env.VITE_AGENT_API_URL || '/api'
      return base.replace(/\/$/, '') + '/sessions'
    },
    /** GET /sessions/:sessionId/events */
    sessionEventsUrl(sessionId: string) {
      const base = import.meta.env.VITE_AGENT_API_URL || '/api'
      const root = base.replace(/\/$/, '')
      return `${root}/sessions/${encodeURIComponent(sessionId)}/events`
    },
    /** GET /models - list Bedrock foundation models */
    get modelsUrl() {
      const base = import.meta.env.VITE_AGENT_API_URL || '/api'
      return base.replace(/\/$/, '') + '/models'
    },
  },
} as const

/**
 * Validate required configuration
 */
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!config.cognito.userPoolId) {
    errors.push('VITE_COGNITO_USER_POOL_ID is required')
  }
  if (!config.cognito.clientId) {
    errors.push('VITE_COGNITO_CLIENT_ID is required')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
