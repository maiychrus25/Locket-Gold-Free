import { randomBytes } from "node:crypto";
import { z } from "zod";
import { deviceSummary } from "../services/locket/client.js";
import { COOKIE, SESSION_AGE, sessionId } from "../session/lifecycle.js";
import { collectSecrets, fail } from "../session/context.js";

function publicSession(session) {
  if (!session) return { authenticated: false };
  return {
    authenticated: true,
    generation: session.generation,
    user: {
      uid: session.resource.client.session.uid,
      email: session.resource.client.session.email,
    },
    device: deviceSummary(session.resource.client),
    expiresAt: session.expiresAt,
  };
}


export function registerAuthRoutes(app, { sessions, loginAttempts, cookieOptions, closeSession }, { createClient, clock }) {
  const pendingLogins = new Set();
  app.get("/api/auth/session", async (req, res) => {
    const id = sessionId(req);
    if (sessions.get(id)?.expiresAt <= clock()) await closeSession(id);
    res.json(publicSession(sessions.get(id)));
  });
  app.post("/api/auth/login", async (req, res) => {
    const parsed = z
      .object({
        email: z.email().max(254),
        password: z.string().min(1).max(256),
      })
      .strict()
      .safeParse(req.body);
    if (!parsed.success) return fail(res, parsed.error, 400);
    const ip = req.ip;
    let attempts = loginAttempts.get(ip);
    if (!attempts || clock() - attempts.start >= 15 * 60 * 1000) {
      attempts = { start: clock(), count: 0 };
      loginAttempts.set(ip, attempts);
    }
    if (attempts.count >= 5 || pendingLogins.has(ip) || sessions.size >= 100)
      return res
        .status(429)
        .json({ error: "Tạm giới hạn đăng nhập. Vui lòng thử lại sau." });
    pendingLogins.add(ip);
    let resource;
    try {
      resource = await createClient();
      await resource.client.login(parsed.data.email, parsed.data.password);
      if (!resource.client.session.uid || !resource.client.session.idToken)
        throw new Error("Missing authenticated session");
      await closeSession(sessionId(req));
      const id = randomBytes(32).toString("hex");
      const session = {
        generation: randomBytes(16).toString("hex"),
        resource,
        expiresAt: clock() + SESSION_AGE,
        active: 0,
        streams: new Set(),
        rateStart: clock(),
        rateCount: 0,
        mediaBusy: false,
        closing: false,
        secrets: new Set(),
      };
      collectSecrets(session);
      sessions.set(id, session);
      res.cookie(COOKIE, id, { ...cookieOptions, maxAge: SESSION_AGE });
      res.json(publicSession(session));
    } catch {
      attempts.count++;
      if (resource) await resource.close();
      res.status(401).json({
        error:
          "Đăng nhập Locket không thành công. Kiểm tra email, mật khẩu hoặc thử lại khi dịch vụ khả dụng.",
      });
    } finally {
      pendingLogins.delete(ip);
    }
  });
  app.post("/api/auth/logout", async (req, res) => {
    const current = sessions.get(sessionId(req));
    if (
      current &&
      req.get("X-Lock-Session") !== undefined &&
      req.get("X-Lock-Session") !== current.generation
    )
      return res.status(409).json({
        error:
          "Phiên tài khoản đã thay đổi. Tải lại trang trước khi đăng xuất.",
        code: "SESSION_CHANGED",
      });
    await closeSession(sessionId(req));
    res.clearCookie(COOKIE, cookieOptions);
    res.json({ data: true });
  });

}
