import { createServer } from "vite";
import { createApp } from "../server/app.js";
import { executeMedia } from "../server/services/locket/media-worker.js";
import { useLocalUpstream } from "./upstream.js";

// This process is exclusively a test harness; production never installs this transport.
useLocalUpstream("http://127.0.0.1:4418/locket");
const app = createApp({ mediaExecutor: executeMedia });
const vite = await createServer({
  server: { middlewareMode: true },
  appType: "spa",
});
app.use(vite.middlewares);
const server = app.listen(4319, "127.0.0.1", () =>
  console.log("Browser fixture server: http://127.0.0.1:4319"),
);
const stop = async () => {
  await app.locals.shutdown();
  await vite.close();
  server.closeAllConnections();
  server.close(() => process.exit(0));
};
process.once("SIGINT", stop);
process.once("SIGTERM", stop);
