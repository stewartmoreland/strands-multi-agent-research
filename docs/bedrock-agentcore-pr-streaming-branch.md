# PR: Avoid reply.send(result) when handler returns async generator and request has SSE

**Target:** [aws/bedrock-agentcore-sdk-typescript](https://github.com/aws/bedrock-agentcore-sdk-typescript)  
**File:** `src/runtime/app.ts`  
**Fixes:** FST_ERR_REP_INVALID_PAYLOAD_TYPE when invocation handler returns async generator with `Accept: text/event-stream` (see issue #66)

## Change

In `_handleInvocation`, inside the `else` branch (non-streaming response), add a fallback: when `reply.sse` is set and `result` is an async generator, stream it via `_handleStreamingResponse` instead of calling `reply.send(result)`. This ensures we never pass an object (the generator) to `reply.send()`, which Fastify rejects.

## Diff (TypeScript source)

```diff
       } else {
+        // When SSE is active, never call reply.send(result) with an async generator (avoids FST_ERR_REP_INVALID_PAYLOAD_TYPE). If result is a generator, stream it instead.
+        if (reply.sse && this._isAsyncGenerator(result)) {
+          await runWithContext(context, async () => {
+            await this._handleStreamingResponse(reply, result)
+          })
+          return
+        }
         // Return non-streaming response
         if (reply.sse) {
```

## Location

Insert after the `} else {` that follows the `if (this._isAsyncGenerator(result)) { ... }` block (around line 374 in current `app.ts`), and before the comment `// Return non-streaming response`.
