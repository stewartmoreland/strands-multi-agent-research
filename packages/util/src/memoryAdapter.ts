/**
 * Memory Adapter for AgentCore Memory Service
 *
 * This adapter bridges the agent runtime with AgentCore Memory for:
 * - Short-term event logging (CreateEvent)
 * - Long-term memory retrieval (RetrieveMemoryRecords)
 * - List sessions per actor (ListSessions)
 * - List events per session (ListEvents)
 *
 * Note: The actual AgentCore Memory SDK requires the infrastructure to be
 * deployed. This implementation provides a local fallback for development.
 */
import {
  BedrockAgentCoreClient,
  CreateEventCommand,
  ListEventsCommand,
  ListSessionsCommand,
  RetrieveMemoryRecordsCommand,
} from "@aws-sdk/client-bedrock-agentcore";

type MessageRole = "user" | "assistant" | "system";

interface MemoryRecord {
  id: string;
  content: string;
  timestamp: number;
  actorId: string;
  sessionId: string;
}

/**
 * In-memory store for development (replaced by AgentCore in production)
 */
const localMemoryStore: Map<string, MemoryRecord[]> = new Map();

/** Local session metadata for listSessions fallback: actorId -> { sessionId, createdAt }[] */
const localSessionIndex: Map<string, { sessionId: string; createdAt: Date }[]> =
  new Map();

/**
 * AgentCore Memory Adapter
 *
 * In production, this would use:
 * - BedrockAgentCoreClient from @aws-sdk/client-bedrock-agentcore
 * - CreateEventCommand for logging events
 * - RetrieveMemoryRecordsCommand for retrieval
 */
class AgentCoreMemoryAdapter {
  private memoryId: string;
  private namespace: string;
  private useLocalFallback: boolean;

  constructor(config?: { memoryId?: string; namespace?: string }) {
    this.memoryId = config?.memoryId || process.env.AGENTCORE_MEMORY_ID || "";
    this.namespace =
      config?.namespace ||
      process.env.AGENTCORE_MEMORY_NAMESPACE ||
      "{actorId}";

    // Use local fallback if no memory ID is configured
    this.useLocalFallback = !this.memoryId;

    if (this.useLocalFallback) {
      console.log(
        "[MemoryAdapter] No AgentCore Memory ID configured, using local fallback",
      );
    }
  }

  /**
   * Log a conversation event to memory
   */
  async logConversationEvent(
    actorId: string,
    sessionId: string,
    role: MessageRole,
    content: string,
  ): Promise<void> {
    const record: MemoryRecord = {
      id: crypto.randomUUID(),
      content: `[${role}]: ${content}`,
      timestamp: Date.now(),
      actorId,
      sessionId,
    };

    if (this.useLocalFallback) {
      // Local storage
      const key = `${actorId}:${sessionId}`;
      const existing = localMemoryStore.get(key) || [];
      existing.push(record);
      localMemoryStore.set(key, existing);
      // Index session for listSessions fallback (first event defines createdAt)
      const sessions = localSessionIndex.get(actorId) ?? [];
      if (!sessions.some((s) => s.sessionId === sessionId)) {
        sessions.push({ sessionId, createdAt: new Date(record.timestamp) });
        sessions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        localSessionIndex.set(actorId, sessions);
      }
      console.log(`[MemoryAdapter] Logged event locally: ${role} message`);
      return;
    }

    // Production: Use AgentCore Memory API
    const client = new BedrockAgentCoreClient({ region: "us-east-1" });
    const roleMap = {
      user: "USER",
      assistant: "ASSISTANT",
      system: "USER",
    } as const;
    await client.send(
      new CreateEventCommand({
        memoryId: this.memoryId,
        actorId,
        sessionId,
        payload: [
          {
            conversational: {
              role: roleMap[role],
              content: { text: content },
            },
          },
        ],
        eventTimestamp: new Date(),
      }),
    );
  }

  /**
   * Retrieve relevant memories for the given actor and query
   */
  async recall(
    actorId: string,
    query: string,
    topK: number = 5,
  ): Promise<string[]> {
    if (this.useLocalFallback) {
      // Local retrieval - simple substring match
      const results: string[] = [];
      const queryLower = query.toLowerCase();

      for (const [key, records] of localMemoryStore.entries()) {
        if (key.startsWith(actorId)) {
          for (const record of records) {
            if (record.content.toLowerCase().includes(queryLower)) {
              results.push(record.content);
              if (results.length >= topK) break;
            }
          }
        }
        if (results.length >= topK) break;
      }

      // If no matches, return recent messages
      if (results.length === 0) {
        for (const [key, records] of localMemoryStore.entries()) {
          if (key.startsWith(actorId)) {
            const recent = records.slice(-topK);
            results.push(...recent.map((r) => r.content));
            break;
          }
        }
      }

      console.log(`[MemoryAdapter] Retrieved ${results.length} local memories`);
      return results.slice(0, topK);
    }

    // Production: Use AgentCore Memory API
    const client = new BedrockAgentCoreClient({ region: "us-east-1" });
    const namespace = this.namespace.replace("{actorId}", actorId);
    const res = await client.send(
      new RetrieveMemoryRecordsCommand({
        memoryId: this.memoryId,
        namespace,
        searchCriteria: { searchQuery: query, topK },
        maxResults: 20,
      }),
    );
    return res.memoryRecordSummaries?.map((r) => r?.content?.text ?? "") ?? [];
  }

  /**
   * Session summary for listSessions response
   */
  async listSessions(
    actorId: string,
  ): Promise<{ sessionId: string; actorId: string; createdAt: Date }[]> {
    if (this.useLocalFallback) {
      const sessions = localSessionIndex.get(actorId) ?? [];
      return sessions.map((s) => ({
        sessionId: s.sessionId,
        actorId,
        createdAt: s.createdAt,
      }));
    }

    const client = new BedrockAgentCoreClient({
      region: process.env.AWS_REGION || "us-east-1",
    });
    const out: { sessionId: string; actorId: string; createdAt: Date }[] = [];
    let nextToken: string | undefined;
    do {
      const res = await client.send(
        new ListSessionsCommand({
          memoryId: this.memoryId,
          actorId,
          maxResults: 50,
          nextToken,
        }),
      );
      for (const s of res.sessionSummaries ?? []) {
        if (s.sessionId && s.actorId && s.createdAt) {
          out.push({
            sessionId: s.sessionId,
            actorId: s.actorId,
            createdAt: s.createdAt,
          });
        }
      }
      nextToken = res.nextToken;
    } while (nextToken);
    return out;
  }

  /**
   * List events for a session (for titles or loading conversation)
   */
  async listEvents(
    actorId: string,
    sessionId: string,
    options?: { maxResults?: number; includePayloads?: boolean },
  ): Promise<
    { eventId: string; role?: string; text?: string; eventTimestamp?: Date }[]
  > {
    const maxResults = options?.maxResults ?? 20;
    const includePayloads = options?.includePayloads ?? true;

    if (this.useLocalFallback) {
      const key = `${actorId}:${sessionId}`;
      const records = localMemoryStore.get(key) ?? [];
      const rolePrefix = /^\[(user|assistant|system)\]:\s*/;
      return records.slice(-maxResults).map((r) => {
        const match = rolePrefix.exec(r.content);
        return {
          eventId: r.id,
          role: match?.[1],
          text: match ? r.content.slice(match[0].length) : r.content,
          eventTimestamp: new Date(r.timestamp),
        };
      });
    }

    const client = new BedrockAgentCoreClient({
      region: process.env.AWS_REGION || "us-east-1",
    });
    const res = await client.send(
      new ListEventsCommand({
        memoryId: this.memoryId,
        actorId,
        sessionId,
        maxResults,
        includePayloads,
      }),
    );

    const events = res.events ?? [];
    return events.map((evt) => {
      let role: string | undefined;
      let text: string | undefined;
      if (includePayloads && evt.payload?.length) {
        for (const p of evt.payload) {
          if ("conversational" in p && p.conversational) {
            role = p.conversational.role;
            const content = p.conversational.content;
            if (content && "text" in content) {
              text = content.text;
            }
            break;
          }
        }
      }
      return {
        eventId: evt.eventId ?? "",
        role,
        text,
        eventTimestamp: evt.eventTimestamp,
      };
    });
  }

  /**
   * Clear local memory store (for testing)
   */
  clearLocalStore(): void {
    localMemoryStore.clear();
    localSessionIndex.clear();
    console.log("[MemoryAdapter] Local memory store cleared");
  }
}

// Export singleton instance
export const memoryAdapter = new AgentCoreMemoryAdapter();
