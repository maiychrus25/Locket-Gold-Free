import { z } from "zod";
import { redact } from "../middleware/security.js";

export const collectSecrets = (session) => {
  const client = session.resource.client;
  for (const value of [
    client.session.idToken,
    client.session.refreshToken,
    client.device.appcheckToken,
    client.device.instanceIdToken,
    ...(client.session.redactionSecrets || []),
  ])
    if (value) session.secrets.add(value);
  return [...session.secrets];
};
export const sendResult = (res, session, data) =>
  res.json({ data: redact(data ?? true, collectSecrets(session)) });
export const fail = (res, error, status = 502, session) => {
  const secrets = session ? collectSecrets(session) : [];
  const message =
    error instanceof z.ZodError
      ? error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join("; ")
      : error.message || "Yêu cầu không thành công.";
  const text = redact(String(message), secrets)
    .replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
    .replace(/(?:refresh_token|id_token|password)=[^&\s]+/gi, "[redacted]");
  if ([502, 503, 504].includes(error.statusCode))
    return res.status(status).json({
      error: `${text.slice(0, 700)} API Locket đang gián đoạn. Chưa xác nhận thao tác thành công; kiểm tra lịch sử trước khi gửi lại để tránh trùng.`,
      code: "UPSTREAM_UNAVAILABLE",
      upstreamStatus: error.statusCode,
      outcome: "unknown",
    });
  res.status(status).json({ error: text.slice(0, 700) });
};
