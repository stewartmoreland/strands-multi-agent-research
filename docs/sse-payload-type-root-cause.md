# Root cause: FST_ERR_REP_INVALID_PAYLOAD_TYPE with SSE

Yes — the issue can be seen as **upstream** in the interaction between **@fastify/sse** and **Fastify**, not only in bedrock-agentcore.

## What’s going on

1. **@fastify/sse** (when the client sends `Accept: text/event-stream`) sets headers **before** calling your handler:

   ```js
   // @fastify/sse index.js, sseHandler
   reply.raw.setHeader('Content-Type', 'text/event-stream')
   reply.raw.setHeader('Cache-Control', 'no-cache')
   // ...
   res = await originalHandler.call(this, request, reply)
   ```

2. So when `BedrockAgentCoreApp._handleInvocation` runs, **the reply already has `Content-Type: text/event-stream`** (via `reply.raw`).

3. In **Fastify’s `reply.send(payload)`** (`reply.js`):
   - It uses `contentType = this.getHeader('content-type')` → `'text/event-stream'`.
   - Serialization only runs when there’s no content-type or it’s JSON-like:
     `} else if (!hasContentType || contentType.indexOf('json') !== -1)`.
   - `'text/event-stream'.indexOf('json') === -1`, so **that branch is skipped** and the payload is **not** JSON-serialized.

4. So any later `reply.send(object)` (e.g. non-streaming branch with `result`, or `reply.status(500).send({ error })` in the catch) passes an **object** into `onSendHook` → `onSendEnd`, and Fastify throws:

   ```text
   FST_ERR_REP_INVALID_PAYLOAD_TYPE: Attempted to send payload of invalid type 'object'. Expected a string or Buffer.
   ```

So the failure is the **combination** of:

- **@fastify/sse**: sets `Content-Type: text/event-stream` before the handler runs.
- **Fastify**: for non-JSON content-types, it does not serialize objects and eventually hits the strict string/Buffer check in `onSendEnd`.

That’s why “any of the changes we’ve made so far” (in bedrock-agentcore only) still give the same error: as long as the handler (or its catch block) calls `reply.send(object)` **after** the SSE plugin has set `text/event-stream`, Fastify will throw. The README example behaves the same because it goes through the same route and the same plugin.

## Where to fix it

**Option A – @fastify/sse (upstream)**  
Don’t set `Content-Type: text/event-stream` (and related headers) before calling the handler. Set them only when the first SSE data is actually sent (e.g. in `sendHeaders()` when `reply.sse.send()` or `keepAlive()` is first used). Then:

- If the handler never uses `reply.sse` and instead does `reply.send(...)`, there is no `text/event-stream` yet, so Fastify can still serialize JSON (or whatever the handler uses).
- If the handler does use `reply.sse.send()`, headers are sent on first write as today.

**Option B – bedrock-agentcore only**  
- Never call `reply.send(result)` when the handler returned an async generator and the request has SSE (stream it via `reply.sse.send()` only) — **suggestion 1**.
- In the catch block, never call `reply.send(object)` after the response has started. If sending an error body, either:
  - Use `reply.type('application/json').status(500).send(JSON.stringify({ error: errorMessage }))` so the payload is already a string, or
  - Avoid sending a body when `reply.raw.headersSent` (or equivalent) is true.

Option B avoids the error for this app but doesn’t fix the general interaction; Option A fixes it for any app using @fastify/sse and then calling `reply.send(object)`.

## Suggested next steps

1. **Comment on the existing bedrock-agentcore issue (#66)**  
   Add a short note that the failure is triggered by @fastify/sse setting `Content-Type: text/event-stream` before the handler runs, so Fastify never serializes objects and any `reply.send(object)` hits `FST_ERR_REP_INVALID_PAYLOAD_TYPE`.

2. **Open an issue (or PR) on fastify/sse**  
   Describe: when `Accept: text/event-stream`, the plugin sets `Content-Type: text/event-stream` on the reply **before** calling the route handler. If the handler then calls `reply.send(object)` (e.g. error response or non-streaming path), Fastify does not serialize the object (because content-type is already set and not JSON), and throws `FST_ERR_REP_INVALID_PAYLOAD_TYPE`. Ask whether the plugin can defer setting `Content-Type` (and optionally other SSE headers) until the first SSE write (e.g. in `sendHeaders()`), so handlers can still use `reply.send()` for non-SSE responses without hitting this error.

3. **Keep the bedrock-agentcore patch**  
   Continue to avoid calling `reply.send(result)` when the handler returns an async generator and the request has SSE, and make the catch block safe (string body or skip send when headers already sent). That way your app works regardless of when @fastify/sse is updated.
