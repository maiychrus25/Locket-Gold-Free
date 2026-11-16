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
