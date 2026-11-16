export function sanitize(value) {
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .filter(
          ([key]) =>
            !(
              /token|password|secret|authorization|credential|cookie/i.test(
                key,
              ) &&
              !/^(?:next_?page_?token|page_?token|sync_?token|invite_?token)$/i.test(
                key,
              )
            ),
        )
        .map(([key, item]) => [key, sanitize(item)]),
    );
  return value;
}
let sessionGeneration = null;
let sessionEpoch = 0;
export const getSessionGeneration = () => sessionGeneration;

export async function request(path, body) {
  const authChange = path === "/api/auth/login" || path === "/api/auth/logout";
  if (authChange) sessionEpoch++;
  const epoch = sessionEpoch;
  const response = await fetch(path, {
    credentials: "same-origin",
    ...(body === undefined
      ? {}
      : {
          method: "POST",
          headers: {
            "X-Lock-Client": "web",
            ...(!path.startsWith("/api/auth/") || path === "/api/auth/logout"
              ? { "X-Lock-Session": sessionGeneration || "" }
              : {}),
            ...(body instanceof FormData
              ? {}
              : {
                  "Content-Type": "application/json",
                }),
          },
          body: body instanceof FormData ? body : JSON.stringify(body),
        }),
  }).catch(() => {
    throw new Error("Chưa kết nối được. Bạn kiểm tra mạng rồi thử lại nhé.");
  });
  const isJson = response.headers.get("content-type")?.includes("json");
  const payload = isJson ? await response.json().catch(() => {
    throw new Error("Chưa đọc được phản hồi. Nếu vừa gửi nội dung, hãy kiểm tra lại trước khi gửi lần nữa.");
  }) : await response.blob();
  if (path !== "/api/catalog" && epoch !== sessionEpoch)
    throw new Error("Phiên đã thay đổi; phản hồi cũ đã được bỏ qua.");
  if (response.ok && path.startsWith("/api/auth/")) {
    const next = payload.authenticated ? payload.generation : null;
    if (next !== sessionGeneration) sessionEpoch++;
    sessionGeneration = next;
  }
  if (
    (response.status === 401 && !path.startsWith("/api/auth/")) ||
    payload?.code === "SESSION_CHANGED"
  ) {
    sessionGeneration = null;
    sessionEpoch++;
    window.dispatchEvent(new Event("lock-session-expired"));
  }
  if (!response.ok)
    throw new Error(
      response.status >= 500
        ? "Kết nối đang gián đoạn. Nếu vừa gửi nội dung, hãy kiểm tra lại trước khi gửi lần nữa."
        : isJson && typeof payload?.error === "string" && !/\b(?:API|SDK|JSON|UID|HTTP|token|password|cookie)\b|[a-z_]+[.:]\s*(?:Invalid|Expected|Unrecognized)/i.test(payload.error)
          ? payload.error
          : "Chưa thực hiện được. Bạn kiểm tra thông tin rồi thử lại nhé.",
    );
  return isJson ? sanitize(payload) : payload;
}
export function records(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];
  for (const key of [
    "data",
    "posts",
    "moments",
    "history",
    "friends",
    "users",
    "messages",
    "conversations",
    "requests",
    "results",
    "items",
    "result",
  ])
    if (value[key] && typeof value[key] === "object") {
      const found = records(value[key]);
      if (found.length) return found;
    }
  return [];
}
export function defaults(operation) {
  return Object.fromEntries(
    (operation?.fields || [])
      .filter((field) => field.default !== undefined)
      .map((field) => [
        field.name,
        typeof field.default === "object"
          ? JSON.stringify(field.default, null, 2)
          : field.default,
      ]),
  );
}
export function parseFields(operation, values) {
  return Object.fromEntries(
    (operation.fields || [])
      .filter(
        (field) =>
          values[field.name] !== undefined &&
          !(
            typeof values[field.name] === "string" &&
            values[field.name].trim() === ""
          ),
      )
      .map((field) => {
        let value = values[field.name];
        if (field.type === "number") {
          value = Number(value);
          if (!Number.isFinite(value))
            throw new Error(`${field.label}: vui lòng nhập số hợp lệ.`);
        }
        if (field.type === "json" && typeof value === "string") {
          try {
            value = JSON.parse(value);
          } catch {
            throw new Error(`${field.label}: JSON chưa hợp lệ.`);
          }
        }
        return [field.name, value];
      }),
  );
}
export function safeUrl(value) {
  if (typeof value !== "string") return undefined;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}
