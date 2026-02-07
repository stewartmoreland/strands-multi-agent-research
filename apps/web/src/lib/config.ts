/**
 * Application configuration from environment variables
 */
export const config = {
  cognito: {
    userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || "",
    clientId: import.meta.env.VITE_COGNITO_CLIENT_ID || "",
    region: import.meta.env.VITE_COGNITO_REGION || "us-east-1",
  },
  agent: {
    invocationsUrl:
      import.meta.env.VITE_AGENT_INVOCATIONS_URL || "/api/invocations",
    /** Base URL for agent API (invocations and sessions). Derived from invocationsUrl. */
    get sessionsUrl() {
      const url =
        import.meta.env.VITE_AGENT_INVOCATIONS_URL || "/api/invocations";
      return url.replace(/\/invocations\/?$/, "") + "/sessions";
    },
    /** URL for a session's events: GET /sessions/:sessionId/events */
    sessionEventsUrl(sessionId: string) {
      const base =
        import.meta.env.VITE_AGENT_INVOCATIONS_URL || "/api/invocations";
      const root = base.replace(/\/invocations\/?$/, "");
      return `${root}/sessions/${encodeURIComponent(sessionId)}/events`;
    },
    /** URL for listing Bedrock foundation models: GET /models */
    get modelsUrl() {
      const base =
        import.meta.env.VITE_AGENT_INVOCATIONS_URL || "/api/invocations";
      return base.replace(/\/invocations\/?$/, "") + "/models";
    },
  },
} as const;

/**
 * Validate required configuration
 */
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.cognito.userPoolId) {
    errors.push("VITE_COGNITO_USER_POOL_ID is required");
  }
  if (!config.cognito.clientId) {
    errors.push("VITE_COGNITO_CLIENT_ID is required");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
