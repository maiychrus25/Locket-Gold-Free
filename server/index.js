import express from "express";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";
import { existsSync } from "node:fs";
import { createApp } from "./app.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dev = process.argv.includes("--dev");
if (process.env.NODE_ENV === "production" && dev)
  throw new Error("Production must run prebuilt assets; --dev is not allowed.");
const app = createApp();
let vite;
if (dev) {
  const { createServer } = await import("vite");
  vite = await createServer({
    root,
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  if (!existsSync(resolve(root, "dist/index.html")))
    throw new Error("Run make build before starting the prebuilt application.");
  app.use(
    express.static(resolve(root, "dist"), { index: false, maxAge: "1h" }),
  );
  app.get("/{*path}", (_req, res) =>
    res.sendFile(resolve(root, "dist/index.html")),
  );
}
const port = Number(process.env.PORT || 4317);
const host = process.env.HOST || "127.0.0.1";
const server = app.listen(port, host, () =>
  console.log(
    `Lock Gold Free: http://${host}:${port}${dev ? " (dev)" : " (prebuilt)"}`,
  ),
);
const stop = async () => {
  await app.locals.shutdown();
  await vite?.close();
  server.closeAllConnections();
  server.close(() => process.exit(0));
};
process.once("SIGINT", stop);
process.once("SIGTERM", stop);
