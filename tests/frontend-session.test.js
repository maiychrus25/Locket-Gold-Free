import test from "node:test";
import assert from "node:assert/strict";
import { request, getSessionGeneration } from "../src/lib/api.js";

test("late 401 from an old session cannot expire the new login", async (t) => {
  const originalWindow = globalThis.window;
  globalThis.window = new EventTarget();
  t.after(() => {
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
  });
  let expired = 0;
  window.addEventListener("lock-session-expired", () => expired++);
  let finishOld;
  let loginCount = 0;
  let sentGeneration;
  t.mock.method(globalThis, "fetch", async (path, options) => {
    if (path.endsWith("/login"))
      return Response.json({
        authenticated: true,
        generation: `generation-${++loginCount}`,
      });
    sentGeneration = options.headers["X-Lock-Session"];
    return new Promise((resolve) => {
      finishOld = resolve;
    });
  });
  await request("/api/auth/login", {
    email: "first@example.com",
    password: "fixture",
  });
  const oldRequest = request("/api/operations/user/getProfile", {});
  await request("/api/auth/login", {
    email: "second@example.com",
    password: "fixture",
  });
  finishOld(Response.json({ error: "expired old session" }, { status: 401 }));
  await assert.rejects(oldRequest, /phản hồi cũ/);
  assert.equal(sentGeneration, "generation-1");
  assert.equal(getSessionGeneration(), "generation-2");
  assert.equal(expired, 0);
});

test("upstream failures show recovery guidance without exposing protocol details", async (t) => {
  t.mock.method(globalThis, "fetch", async () => Response.json({
    error: "API request to postMomentV2 failed: Bad Gateway",
    code: "UPSTREAM_UNAVAILABLE",
    upstreamStatus: 502,
    outcome: "unknown",
  }, { status: 502 }));
  await assert.rejects(request("/api/media/post", {}), {
    message: "Kết nối đang gián đoạn. Nếu vừa gửi nội dung, hãy kiểm tra lại trước khi gửi lần nữa.",
  });
});

test("a rejected custom color shows a human message instead of a validation expression", async (t) => {
  t.mock.method(globalThis, "fetch", async () => Response.json({
    error: "textColor: Invalid string: must match pattern /^#[\\da-fA-F]{6}$/",
  }, { status: 400 }));
  await assert.rejects(request("/api/media/post", {}), {
    message: "Chưa thực hiện được. Bạn kiểm tra thông tin rồi thử lại nhé.",
  });
});
