/**
 * Extract actorId (sub) from JWT Bearer token.
 * Decodes payload without verification (API Gateway Cognito authorizer validates).
 */

export function getActorIdFromToken(token: string): string | null {
  if (!token?.trim()) return null;
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
