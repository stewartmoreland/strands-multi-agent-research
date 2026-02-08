/**
 * PowerTools Logger for research-api (Lambda + local Express).
 * Use appendKeys() in middleware to add request_id and session_id for the invocation.
 * Log level from POWERTOOLS_LOG_LEVEL or LOG_LEVEL env (default INFO).
 */
import { Logger } from "@aws-lambda-powertools/logger";

export const logger = new Logger({
  serviceName: process.env.POWERTOOLS_SERVICE_NAME ?? "research-api",
});
