import express from "express";
import { spawnSync } from "node:child_process";
import { createSdkSession } from "./services/locket/client.js";
import { isolatedMedia } from "./services/locket/media.js";
import { installSecurity } from "./middleware/security.js";
import { installErrorHandlers } from "./middleware/errors.js";
import { createSessionLifecycle } from "./session/lifecycle.js";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerCatalogRoutes } from "./routes/catalog.js";
import { registerOperationsRoutes } from "./routes/operations.js";
import { registerMediaRoutes } from "./routes/media.js";
import { registerChatRoutes } from "./routes/chat.js";

export function createApp({
  createClient = createSdkSession,
  mediaExecutor = isolatedMedia,
  clock = Date.now,
  allowedOrigin = process.env.APP_ORIGIN,
  secureCookies = process.env.NODE_ENV === "production",
} = {}) {
  const app = express();
  installSecurity(app, allowedOrigin);
  const lifecycle = createSessionLifecycle({ clock, secureCookies });
  app.locals.shutdown = lifecycle.shutdown;
  const ffmpeg =
    spawnSync("ffmpeg", ["-version"], { stdio: "ignore", timeout: 3000 })
      .status === 0;
  registerCatalogRoutes(app, { ffmpeg });
  registerAuthRoutes(app, lifecycle, { createClient, clock });
  registerOperationsRoutes(app, lifecycle);
  registerMediaRoutes(app, lifecycle, { mediaExecutor, ffmpeg });
  registerChatRoutes(app, lifecycle);
  installErrorHandlers(app);
  return app;
}
