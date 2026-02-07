/**
 * Stateless server helpers for request/response handling.
 * Extracted for testability.
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import type { UiEvent } from "@repo/shared/events";

/**
 * Resolve actorId (user sub) from Authorization Bearer JWT.
 * Decodes the JWT payload without signature verification.
 */
export function getActorIdFromAuth(req: IncomingMessage): string | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7).trim();
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(base64, "base64").toString("utf-8");
    const decoded = JSON.parse(json) as { sub?: string };
    return typeof decoded.sub === "string" ? decoded.sub : null;
  } catch {
    return null;
  }
}

/**
 * Parse JSON body from request
 */
export function parseBody<T>(req: IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body) as T);
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

/**
 * Send SSE event to response
 */
export function sendEvent(res: ServerResponse, event: UiEvent): void {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}
