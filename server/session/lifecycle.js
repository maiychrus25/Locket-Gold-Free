import { collectSecrets } from "./context.js";

export const SESSION_AGE = 2 * 60 * 60 * 1000;
export const COOKIE = "lock_session";

export function sessionId(req) {
  const value = req.headers.cookie
    ?.split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${COOKIE}=`))
    ?.slice(COOKIE.length + 1);
  return value && /^[a-f0-9]{64}$/.test(value) ? value : null;
}

export function createSessionLifecycle({ clock, secureCookies }) {
  const sessions = new Map();
  const loginAttempts = new Map();
  const pendingWork = new Set();
  const cookieOptions = {
    httpOnly: true,
    sameSite: "strict",
    secure: secureCookies,
    path: "/",
  };
  const closeSession = async (id) => {
    const session = sessions.get(id);
    if (!session) return;
    sessions.delete(id);
    session.closing = true;
    session.streams.forEach((close) => close());
    if (session.active === 0) await session.resource.close();
  };
  const cleanup = setInterval(() => {
    for (const [id, session] of sessions)
      if (session.expiresAt <= clock()) void closeSession(id);
    for (const [ip, item] of loginAttempts)
      if (clock() - item.start >= 15 * 60 * 1000) loginAttempts.delete(ip);
  }, 30_000);
  cleanup.unref();
  const shutdown = async () => {
    clearInterval(cleanup);
    await Promise.all([...sessions.keys()].map(closeSession));
    await Promise.allSettled([...pendingWork]);
  };
  const authenticated = async (req, res, next) => {
    const id = sessionId(req);
    const session = sessions.get(id);
    if (session && session.expiresAt <= clock()) await closeSession(id);
    if (!sessions.has(id))
      return res.status(401).json({
        error: "Phiên chưa kết nối hoặc đã hết hạn. Anh đăng nhập lại nhé.",
      });
    const generation = req.get("X-Lock-Session") ?? req.query.generation;
    if (generation !== undefined && generation !== session.generation)
      return res.status(409).json({
        error: "Phiên tài khoản đã thay đổi. Tải lại trang trước khi tiếp tục.",
        code: "SESSION_CHANGED",
      });
    req.account = session;
    next();
  };
  const limited = (req, res, next) => {
    const session = req.account;
    if (clock() - session.rateStart > 60_000) {
      session.rateCount = 0;
      session.rateStart = clock();
    }
    if (++session.rateCount > 120)
      return res
        .status(429)
        .json({ error: "Quá nhiều thao tác. Vui lòng thử lại sau một phút." });
    next();
  };
  const run = async (session, action) => {
    session.active++;
    collectSecrets(session);
    const work = (async () => {
      try {
        return await action(session.resource.client);
      } finally {
        collectSecrets(session);
        session.active--;
        if (session.closing && session.active === 0)
          await session.resource.close();
      }
    })();
    pendingWork.add(work);
    try {
      return await work;
    } finally {
      pendingWork.delete(work);
    }
  };
  return {
    sessions,
    loginAttempts,
    cookieOptions,
    closeSession,
    authenticated,
    limited,
    run,
    shutdown,
  };
}
