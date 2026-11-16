import express from "express";
import helmet from "helmet";

const tokenKey =
  /^(?:id_?token|refresh_?token|access_?token|password|appcheck_?token|instance_?id_?token|authorization|fcm_?token|notification_?token)$/i;

export function redact(value, secrets = []) {
  if (typeof value === "string")
    return secrets
      .filter((secret) => typeof secret === "string" && secret.length >= 6)
      .reduce((text, secret) => text.replaceAll(secret, "[redacted]"), value);
  if (Array.isArray(value)) return value.map((item) => redact(item, secrets));
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !tokenKey.test(key))
        .map(([key, item]) => [key, redact(item, secrets)]),
    );
  return value;
}

export function hasUnsafeKeys(value) {
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(
    ([key, item]) =>
      ["__proto__", "constructor", "prototype"].includes(key) ||
      hasUnsafeKeys(item),
  );
}

export function installSecurity(app, allowedOrigin) {
  app.disable("x-powered-by");
  app.use(
    helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }),
  );
  app.use("/api", (_req, res, next) => {
    res.set("Cache-Control", "no-store");
    res.set("X-Accel-Buffering", "no");
    next();
  });
  app.use("/api", (req, res, next) => {
    if (allowedOrigin) {
      if (req.get("host") !== new URL(allowedOrigin).host)
        return res.status(403).json({ error: "Host không hợp lệ." });
    } else if (!["localhost", "127.0.0.1", "[::1]"].includes(req.hostname))
      return res
        .status(403)
        .json({ error: "Bản dev chỉ chấp nhận truy cập local." });
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      const origin = req.get("origin");
      if (
        req.get("X-Lock-Client") !== "web" ||
        (origin &&
          origin !==
            (allowedOrigin || `${req.protocol}://${req.get("host")}`)) ||
        req.get("sec-fetch-site") === "cross-site"
      )
        return res
          .status(403)
          .json({ error: "Yêu cầu phải xuất phát từ website này." });
    }
    next();
  });
  app.use(express.json({ limit: "64kb" }));
  app.use("/api", (req, res, next) => {
    if (hasUnsafeKeys(req.body))
      return res.status(400).json({ error: "Thuộc tính không hợp lệ." });
    next();
  });

}
