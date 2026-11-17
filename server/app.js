import express from "express";
import { spawnSync } from "node:child_process";
import { isIP } from "node:net";
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
  production = process.env.NODE_ENV === "production",
  proxyAddress = process.env.TRUST_PROXY_IP,
  secureCookies = production,
} = {}) {
  if (production) {
    try {
      const origin = new URL(allowedOrigin);
      if (origin.protocol !== "https:" || origin.origin !== allowedOrigin)
        throw new Error("Invalid public origin");
    } catch {
      throw new Error("Production requires APP_ORIGIN as an exact HTTPS origin without a path or credentials.");
    }
  }
  if (proxyAddress && !isIP(proxyAddress))
    throw new Error("TRUST_PROXY_IP must be one explicit trusted proxy IP address.");
  const app = express();
  if (production) app.set("trust proxy", proxyAddress ? ["loopback", proxyAddress] : "loopback");
  installSecurity(app, allowedOrigin, { production });
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
