/**
 * Local dev: run the same Express app on port 3001.
 */

import app from "./app";

const PORT = Number.parseInt(process.env.API_PORT || "3001", 10);

app.listen(PORT, () => {
  console.log("[api] Listening on http://localhost:%s", PORT);
  console.log(
    "[api] Routes: GET /models, GET /sessions, GET /sessions/:id/events",
  );
});
