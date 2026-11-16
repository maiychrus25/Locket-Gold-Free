import { z } from "zod";
import { redact } from "../middleware/security.js";
import { collectSecrets, fail } from "../session/context.js";

export function registerChatRoutes(app, { authenticated, limited }) {
  app.get("/api/chat/events", authenticated, limited, async (req, res) => {
    const parsed = z
      .string()
      .trim()
      .min(1)
      .max(150)
      .regex(/^[\w@.:-]+$/)
      .safeParse(req.query.otherUserId);
    if (!parsed.success) return fail(res, parsed.error, 400);
    const session = req.account;
    session.streams.forEach((close) => close());
    res
      .status(200)
      .set({ "Content-Type": "text/event-stream", Connection: "keep-alive" });
    res.flushHeaders();
    let controller;
    let ended = false;
    const send = (event, value) => {
      if (!ended && !res.destroyed)
        res.write(
          `event: ${event}\ndata: ${JSON.stringify(redact(value, collectSecrets(session)))}\n\n`,
        );
    };
    const heartbeat = setInterval(() => {
      if (!ended) res.write(": heartbeat\n\n");
    }, 15_000);
    const close = () => {
      if (ended) return;
      ended = true;
      clearInterval(heartbeat);
      controller?.close();
      session.streams.delete(close);
      res.end();
    };
    session.streams.add(close);
    res.once("close", close);
    send("status", { state: "connecting" });
    try {
      controller = await session.resource.client.chat.listenRealtime(
        parsed.data,
        (data) => send("message", data),
      );
      if (ended) {
        controller.close();
        return;
      }
      controller.on("open", () => send("status", { state: "connected" }));
      controller.on("close", () => send("status", { state: "reconnecting" }));
      controller.on("error", () =>
        send("error", { error: "Kết nối Locket bị gián đoạn." }),
      );
    } catch {
      send("error", { error: "Không thể kết nối chat Locket." });
      close();
    }
  });
}
