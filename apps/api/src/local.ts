/**
 * Local dev: run the same Express app on port 3001.
 */

import app from "./app";
import { logger } from "./logger";

const PORT = Number.parseInt(process.env.API_PORT || "3001", 10);

app.listen(PORT, () => {
  logger.info("Listening", {
    url: `http://localhost:${PORT}`,
    routes: ["GET /models", "GET /sessions", "GET /sessions/:id/events"],
  });
});
