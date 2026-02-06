import type { InvocationRequest } from "@repo/shared";
import type { UiEvent } from "@repo/shared/events";
import { context, propagation } from "@opentelemetry/api";
import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { memoryAdapter } from "./memoryAdapter";
import { orchestrator } from "./orchestrator";

const PORT = parseInt(process.env.PORT || "8080", 10);
const HOST = process.env.HOST || "0.0.0.0";

/**
 * Resolve actorId (user sub) from Authorization Bearer JWT.
 * Decodes the JWT payload without signature verification.
 * For production with Cognito, use aws-jwt-verify to verify the token when COGNITO_USER_POOL_ID is set.
 */
function getActorIdFromAuth(req: IncomingMessage): string | null {
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
async function parseBody<T>(req: IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body) as T);
      } catch (error) {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

/**
 * Send SSE event to response
 */
function sendEvent(res: ServerResponse, event: UiEvent): void {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

/**
 * Handle /invocations endpoint
 */
async function handleInvocations(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  // Parse request body
  const body = await parseBody<InvocationRequest>(req);
  const { prompt, sessionId, userId } = body;

  if (!prompt) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "prompt is required" }));
    return;
  }

  // Check Accept header for SSE
  const acceptHeader = req.headers.accept || "";
  const wantsSSE = acceptHeader.includes("text/event-stream");

  if (wantsSSE) {
    // SSE streaming response
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });
    res.flushHeaders?.();

    // Send meta event with session info
    const currentSessionId = sessionId || crypto.randomUUID();
    sendEvent(res, { type: "meta", sessionId: currentSessionId });

    try {
      // Run orchestrator in context with session.id baggage for AgentCore Observability
      const sessionBaggage = propagation.createBaggage({
        "session.id": { value: currentSessionId },
      });
      const sessionContext = propagation.setBaggage(
        context.active(),
        sessionBaggage,
      );
      await context.with(sessionContext, async () => {
        for await (const event of orchestrator.stream(prompt, {
          sessionId: currentSessionId,
          userId,
        })) {
          sendEvent(res, event);
        }
      });

      // Send done event
      sendEvent(res, { type: "message.done" });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      sendEvent(res, { type: "error", message: errorMessage });
    }

    res.end();
  } else {
    // JSON response (non-streaming)
    try {
      const currentSessionId = sessionId || crypto.randomUUID();
      const sessionBaggage = propagation.createBaggage({
        "session.id": { value: currentSessionId },
      });
      const sessionContext = propagation.setBaggage(
        context.active(),
        sessionBaggage,
      );
      const result = await context.with(sessionContext, () =>
        orchestrator.invoke(prompt, { sessionId: currentSessionId, userId }),
      );
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      });
      res.end(JSON.stringify({ result }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      res.writeHead(500, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      });
      res.end(JSON.stringify({ error: errorMessage }));
    }
  }
}

/**
 * Handle GET /sessions – list chat sessions for the authenticated user.
 * Returns session list with messageCount (from listEvents).
 */
async function handleSessions(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const actorId = getActorIdFromAuth(req);
  if (!actorId) {
    res.writeHead(401, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(JSON.stringify({ error: "Authentication required" }));
    return;
  }

  try {
    const list = await memoryAdapter.listSessions(actorId);
    const sessions = await Promise.all(
      list.map(async (s) => {
        const events = await memoryAdapter.listEvents(actorId, s.sessionId, {
          maxResults: 100,
          includePayloads: false,
        });
        const title = events.find((e) => e.role === "assistant")?.text;
        return {
          id: s.sessionId,
          createdAt: s.createdAt.toISOString(),
          title,
          messageCount: events.length,
        };
      }),
    );
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(JSON.stringify({ sessions }));
  } catch (error) {
    console.error("List sessions error:", error);
    res.writeHead(500, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(JSON.stringify({ error: "Failed to list sessions" }));
  }
}

/**
 * Handle GET /sessions/:sessionId/events – return message history for a session.
 * Requires auth. Returns events as { events: { eventId, role, text, eventTimestamp }[] }
 * with role normalized to 'user' | 'assistant'.
 */
async function handleSessionEvents(
  req: IncomingMessage,
  res: ServerResponse,
  sessionId: string,
): Promise<void> {
  const actorId = getActorIdFromAuth(req);
  if (!actorId) {
    res.writeHead(401, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(JSON.stringify({ error: "Authentication required" }));
    return;
  }

  try {
    const raw = await memoryAdapter.listEvents(actorId, sessionId, {
      maxResults: 100,
      includePayloads: true,
    });
    const events = raw.map((e) => ({
      eventId: e.eventId,
      role: normalizeRole(e.role),
      text: e.text ?? "",
      eventTimestamp: e.eventTimestamp?.toISOString(),
    }));
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(JSON.stringify({ events }));
  } catch (error) {
    console.error("List session events error:", error);
    res.writeHead(500, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(JSON.stringify({ error: "Failed to list session events" }));
  }
}

function normalizeRole(role: string | undefined): "user" | "assistant" {
  if (!role) return "assistant";
  const r = role.toUpperCase();
  if (r === "USER") return "user";
  return "assistant";
}

/**
 * Handle /ping endpoint (AgentCore Runtime health check)
 * Returns status and time_of_last_update as per HTTP protocol contract
 */
function handlePing(res: ServerResponse): void {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      status: "Healthy",
      time_of_last_update: Math.floor(Date.now() / 1000),
    }),
  );
}

/**
 * Parse pathname from request URL (strip query string)
 */
function getPathname(url: string): string {
  const i = url.indexOf("?");
  return i === -1 ? url : url.slice(0, i);
}

/**
 * Request handler
 */
async function requestHandler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const url = req.url || "/";
  const pathname = getPathname(url);
  const method = req.method || "GET";

  // Handle CORS preflight
  if (method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization",
    });
    res.end();
    return;
  }

  try {
    if (pathname === "/invocations" && method === "POST") {
      await handleInvocations(req, res);
    } else if (pathname === "/sessions" && method === "GET") {
      await handleSessions(req, res);
    } else if (
      pathname.startsWith("/sessions/") &&
      pathname.endsWith("/events") &&
      method === "GET"
    ) {
      const sessionId = pathname.slice("/sessions/".length, -"/events".length);
      if (sessionId) {
        await handleSessionEvents(req, res, sessionId);
      } else {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Not found" }));
      }
    } else if (pathname === "/ping" && method === "GET") {
      handlePing(res);
    } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not found" }));
    }
  } catch (error) {
    console.error("Request handler error:", error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Internal server error" }));
  }
}

// Create and start server
const server = createServer(requestHandler);

server.listen(PORT, HOST, () => {
  console.log(`Agent server listening on http://${HOST}:${PORT}`);
  console.log("Endpoints:");
  console.log(
    `  POST /invocations - Agent invocation (supports SSE streaming)`,
  );
  console.log(
    `  GET  /sessions         - List chat sessions (requires Authorization)`,
  );
  console.log(
    `  GET  /sessions/:id/events - Session message history (requires Authorization)`,
  );
  console.log(`  GET  /ping             - Health check (AgentCore Runtime)`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
