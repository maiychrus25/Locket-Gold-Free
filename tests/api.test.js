import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { createApp } from "../server/app.js";
import { executeMedia } from "../server/media-worker.js";

async function setup(t, options = {}) {
  const calls = [];
  let closed = 0;
  const createClient = async () => {
    const client = {
      device: {
        autoEmulate: true,
        installationId: "device-id",
        modelInfo: { name: "iPhone 15 Pro", model: "iPhone16,1", ios: "18.1" },
        appVersion: "2.68.0",
        buildNumber: "2523",
      },
      session: {
        uid: null,
        email: null,
        idToken: "secret-id-token",
        refreshToken: "secret-refresh",
        refresh: async () => {
          calls.push("refresh");
        },
      },
      login: async (email, password) => {
        if (password === "bad-password")
          throw new Error("INVALID_LOGIN_CREDENTIALS");
        client.session.uid = email;
        client.session.email = email;
        return { idToken: "secret-id-token", refreshToken: "secret-refresh" };
      },
      user: {
        getProfile: async (uid) => {
          const secret = client.session.idToken;
          if (options.waitForProfile) await options.waitForProfile;
          return {
            uid: uid || client.session.uid,
            first_name: "Test",
            message: secret,
            idToken: secret,
            nested: { refresh_token: "secret-refresh" },
          };
        },
        updateName: async (...args) => {
          calls.push(args);
          return { updated: true };
        },
        updateAvatar: async (buffer) => {
          calls.push(buffer);
          return { updated: true };
        },
      },
      moments: {
        getMoments: async () => ({
          moments: [
            { moment_uid: "friend-moment", user_uid: client.session.uid },
          ],
          nextPageToken: null,
        }),
        getLatest: async () => {
          if (options.upstreamError)
            throw new Error("Network secret-id-token failed");
          return [];
        },
        post: async (args) => {
          calls.push(args);
          if (options.waitForMedia) await options.waitForMedia;
          return { canonical_uid: "posted-id", caption: args.caption };
        },
        uploadImage: async (buffer) => {
          calls.push(buffer);
          return "https://firebasestorage.googleapis.com/image";
        },
      },
      friends: { getAllFriends: async () => [{ uid: "friend-one" }] },
      chat: {
        listenRealtime: async (_uid, callback) => {
          if (options.streamFailure) throw new Error("upstream disconnected");
          queueMicrotask(() =>
            callback({ text: "hello", idToken: "secret-id-token" }),
          );
          return {
            close: () => {
              closed++;
            },
            on() {},
          };
        },
      },
      setDevice: (value) => {
        calls.push(value);
      },
    };
    return {
      client,
      close: async () => {
        client.session.idToken = null;
        client.session.refreshToken = null;
        closed++;
      },
    };
  };
  const app = createApp({
    createClient,
    mediaExecutor: executeMedia,
    ...options,
  });
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const url = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => {
    await app.locals.shutdown();
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  });
  const request = (path, body, cookie, extra = {}) =>
    fetch(url + path, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        ...(body === undefined
          ? {}
          : { "Content-Type": "application/json", "X-Lock-Client": "web" }),
        ...(cookie ? { Cookie: cookie } : {}),
        ...extra,
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  const login = async (email = "one@example.com") => {
    const response = await request("/api/auth/login", {
      email,
      password: "correct-password",
    });
    assert.equal(response.status, 200);
    return response.headers.get("set-cookie").split(";")[0];
  };
  return { request, login, calls, url, getClosed: () => closed };
}

test("requires a session before any account operation", async (t) => {
  const { request } = await setup(t);
  const response = await request("/api/operations/user/getProfile", {});
  assert.equal(response.status, 401);
});

test("catalog is public and never includes invocation code or credentials", async (t) => {
  const { request } = await setup(t);
  const response = await request("/api/catalog");
  const data = await response.json();
  assert.ok(
    data.operations.some(
      (op) =>
        op.group === "moments" && op.method === "post" && op.media === "post",
    ),
  );
  assert.ok(data.presets.length > 20);
  assert.equal(JSON.stringify(data).includes("secret-"), false);
});

test("login rotates an opaque HttpOnly cookie and does not expose tokens", async (t) => {
  const { request } = await setup(t);
  const response = await request("/api/auth/login", {
    email: "one@example.com",
    password: "correct-password",
  });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("set-cookie"), /HttpOnly/);
  assert.match(response.headers.get("set-cookie"), /SameSite=Strict/);
  const text = await response.text();
  assert.equal(text.includes("secret-"), false);
  assert.equal(JSON.parse(text).user.email, "one@example.com");
});

test("sessions keep different accounts isolated and redact nested tokens", async (t) => {
  const { login, request } = await setup(t);
  const a = await login();
  const b = await login("two@example.com");
  for (const [cookie, email] of [
    [a, "one@example.com"],
    [b, "two@example.com"],
  ]) {
    const response = await request(
      "/api/operations/user/getProfile",
      {},
      cookie,
    );
    const text = await response.text();
    assert.equal(JSON.parse(text).data.uid, email);
    assert.equal(text.includes("secret-"), false);
  }
});

test("rejects unallowlisted methods and unknown parameters", async (t) => {
  const { request, login, calls } = await setup(t);
  const cookie = await login();
  assert.equal(
    (await request("/api/operations/user/constructor", {}, cookie)).status,
    404,
  );
  assert.equal(
    (await request("/api/operations/session/getValidToken", {}, cookie)).status,
    404,
  );
  assert.equal(
    (
      await request(
        "/api/operations/user/updateName",
        { firstName: "A", lastName: "B", idToken: "evil" },
        cookie,
      )
    ).status,
    400,
  );
  assert.equal(calls.length, 0);
});

test("validates required values and converts only documented argument shapes", async (t) => {
  const { request, login, calls } = await setup(t);
  const cookie = await login();
  assert.equal(
    (
      await request(
        "/api/operations/user/updateName",
        { firstName: "", lastName: "B" },
        cookie,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await request(
        "/api/operations/user/updateName",
        { firstName: "Alice", lastName: "Nguyen" },
        cookie,
      )
    ).status,
    200,
  );
  assert.deepEqual(calls[0], ["Alice", "Nguyen"]);
});

test("rejects cross-origin mutations and missing application header", async (t) => {
  const { request, login, url } = await setup(t);
  const cookie = await login();
  assert.equal(
    (
      await request("/api/operations/user/getProfile", {}, cookie, {
        Origin: "https://evil.example",
      })
    ).status,
    403,
  );
  const response = await fetch(url + "/api/auth/logout", {
    method: "POST",
    headers: { Cookie: cookie },
  });
  assert.equal(response.status, 403);
});

test("logout invalidates the old session and closes its resources", async (t) => {
  const { request, login, getClosed } = await setup(t);
  const cookie = await login();
  assert.equal((await request("/api/auth/logout", {}, cookie)).status, 200);
  assert.equal(
    (await request("/api/auth/session", undefined, cookie)).status,
    200,
  );
  assert.equal(
    (await request("/api/operations/user/getProfile", {}, cookie)).status,
    401,
  );
  assert.ok(getClosed() >= 1);
});

test("expired sessions cannot access account data", async (t) => {
  let time = 1000;
  const { request, login } = await setup(t, { clock: () => time });
  const cookie = await login();
  time += 2 * 60 * 60 * 1000 + 1;
  assert.equal(
    (await request("/api/operations/user/getProfile", {}, cookie)).status,
    401,
  );
});

test("upstream errors are visible without leaking a session secret", async (t) => {
  const { request, login } = await setup(t, { upstreamError: true });
  const cookie = await login();
  const response = await request(
    "/api/operations/moments/getLatest",
    {},
    cookie,
  );
  assert.equal(response.status, 502);
  assert.equal((await response.text()).includes("secret-id-token"), false);
});

test("rate limits failed logins without echoing credentials", async (t) => {
  const { request } = await setup(t);
  for (let i = 0; i < 5; i++)
    assert.equal(
      (
        await request("/api/auth/login", {
          email: "one@example.com",
          password: "bad-password",
        })
      ).status,
      401,
    );
  assert.equal(
    (
      await request("/api/auth/login", {
        email: "one@example.com",
        password: "bad-password",
      })
    ).status,
    429,
  );
});

test("media requires real image bytes, not an attacker path or mislabeled file", async (t) => {
  const { url, login, calls } = await setup(t);
  const cookie = await login();
  const form = new FormData();
  form.append(
    "image",
    new Blob(["not-an-image"], { type: "image/png" }),
    "payload.png",
  );
  form.append("options", "{}");
  const response = await fetch(url + "/api/media/post", {
    method: "POST",
    headers: { Cookie: cookie, "X-Lock-Client": "web" },
    body: form,
  });
  assert.equal(response.status, 400);
  assert.equal(calls.length, 0);
});

test("media passes validated bytes and typed options to the SDK", async (t) => {
  const { url, login, calls } = await setup(t);
  const cookie = await login();
  const form = new FormData();
  const image = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=",
    "base64",
  );
  form.append("image", new Blob([image], { type: "image/png" }), "photo.png");
  form.append("options", JSON.stringify({ caption: "Hello", isPrivate: true }));
  const response = await fetch(url + "/api/media/post", {
    method: "POST",
    headers: { Cookie: cookie, "X-Lock-Client": "web" },
    body: form,
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).data.canonical_uid, "posted-id");
  assert.ok(Buffer.isBuffer(calls[0].image));
  assert.equal(calls[0].isPrivate, true);
});

test("bounded concurrent account reads preserve isolation", async (t) => {
  const { request, login } = await setup(t);
  const cookie = await login();
  const responses = await Promise.all(
    Array.from({ length: 30 }, () =>
      request("/api/operations/user/getProfile", {}, cookie),
    ),
  );
  assert.ok(responses.every((response) => response.status === 200));
  for (const response of responses)
    assert.equal((await response.json()).data.uid, "one@example.com");
});

test("logout during an active request cannot expose its token in response text", async (t) => {
  let release;
  const waitForProfile = new Promise((resolve) => {
    release = resolve;
  });
  const { request, login } = await setup(t, { waitForProfile });
  const cookie = await login();
  const reading = request("/api/operations/user/getProfile", {}, cookie);
  await new Promise((resolve) => setTimeout(resolve, 30));
  await request("/api/auth/logout", {}, cookie);
  release();
  const response = await reading;
  assert.equal((await response.text()).includes("secret-id-token"), false);
});

test("disconnecting an upload keeps its media slot until the SDK operation ends", async (t) => {
  let release;
  const waitForMedia = new Promise((resolve) => {
    release = resolve;
  });
  const { url, login, calls } = await setup(t, { waitForMedia });
  const cookie = await login();
  const form = () => {
    const data = new FormData();
    data.append(
      "image",
      new Blob(
        [
          Buffer.from(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=",
            "base64",
          ),
        ],
        { type: "image/png" },
      ),
      "photo.png",
    );
    return data;
  };
  const controller = new AbortController();
  const first = fetch(url + "/api/media/post", {
    method: "POST",
    headers: { Cookie: cookie, "X-Lock-Client": "web" },
    body: form(),
    signal: controller.signal,
  }).catch(() => null);
  for (let i = 0; i < 100 && !calls.length; i++)
    await new Promise((resolve) => setTimeout(resolve, 5));
  assert.equal(calls.length, 1);
  controller.abort();
  await first;
  const secondRequest = fetch(url + "/api/media/post", {
    method: "POST",
    headers: { Cookie: cookie, "X-Lock-Client": "web" },
    body: form(),
  });
  const second = await Promise.race([
    secondRequest,
    new Promise((resolve) => setTimeout(() => resolve(null), 200)),
  ]);
  release();
  await secondRequest;
  assert.equal(second?.status, 429);
});

test("SSE emits redacted messages and closes its upstream controller on disconnect", async (t) => {
  const { url, login, getClosed } = await setup(t);
  const cookie = await login();
  const response = await fetch(
    url + "/api/chat/events?otherUserId=friend-user",
    { headers: { Cookie: cookie }, signal: AbortSignal.timeout(2000) },
  );
  assert.equal(response.status, 200);
  const reader = response.body.getReader();
  let text = "";
  while (!text.includes("hello")) {
    const part = await reader.read();
    assert.equal(part.done, false);
    text += new TextDecoder().decode(part.value);
  }
  assert.match(text, /event: message/);
  assert.equal(text.includes("secret-id-token"), false);
  await reader.cancel();
  for (let i = 0; i < 100 && getClosed() === 0; i++)
    await new Promise((resolve) => setTimeout(resolve, 5));
  assert.ok(getClosed() >= 1);
});

test("prototype properties and unsupported ownership overrides are rejected", async (t) => {
  const { login, request } = await setup(t);
  const cookie = await login();
  assert.equal(
    (
      await request(
        "/api/operations/user/syncClientData",
        JSON.parse('{"extraData":{"__proto__":{"admin":true}}}'),
        cookie,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await request(
        "/api/operations/chat/deleteMessage",
        {
          conversationUid: "conversation",
          messageUid: "message",
          validateOwnership: false,
        },
        cookie,
      )
    ).status,
    400,
  );
});

test("an SVG mislabeled as PNG cannot enter the raster upload pipeline", async (t) => {
  const { url, login, calls } = await setup(t);
  const cookie = await login();
  const form = new FormData();
  form.append(
    "image",
    new Blob(
      [
        '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1"/></svg>',
      ],
      { type: "image/png" },
    ),
    "fake.png",
  );
  const response = await fetch(url + "/api/media/post", {
    method: "POST",
    headers: { Cookie: cookie, "X-Lock-Client": "web" },
    body: form,
  });
  assert.equal(response.status, 400);
  assert.equal(calls.length, 0);
});

test("a stale page cannot write through a different account cookie", async (t) => {
  const { request, login, calls } = await setup(t);
  const a = await login();
  const { generation } = await request("/api/auth/session", undefined, a).then(
    (response) => response.json(),
  );
  const b = await login("two@example.com");
  const response = await request(
    "/api/operations/user/updateName",
    { firstName: "Wrong", lastName: "Account" },
    b,
    { "X-Lock-Session": generation },
  );
  assert.equal(response.status, 409);
  assert.equal(calls.length, 0);
});

test("unfiltered history does not misidentify friend moments as my own", async (t) => {
  const { request, login } = await setup(t);
  const cookie = await login();
  const all = await request(
    "/api/operations/moments/getMoments",
    {},
    cookie,
  ).then((response) => response.json());
  assert.equal(all.data.moments[0].user_uid, null);
  assert.equal(all.data.moments[0].authorVerified, false);
  const own = await request(
    "/api/operations/moments/getMoments",
    { filteredByUserId: "friend-user" },
    cookie,
  ).then((response) => response.json());
  assert.equal(own.data.moments[0].user_uid, "friend-user");
  assert.equal(own.data.moments[0].authorVerified, true);
});

test("video normalization uses detected bytes instead of the declared MIME", async (t) => {
  let detected;
  const { url, login } = await setup(t, {
    mediaExecutor: async (
      _client,
      _operation,
      _values,
      _image,
      _video,
      type,
    ) => {
      detected = type;
      return true;
    },
  });
  const cookie = await login();
  const form = new FormData();
  form.append(
    "video",
    new Blob([Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0, 0, 0, 0])], {
      type: "video/mp4",
    }),
    "misnamed.mp4",
  );
  const response = await fetch(url + "/api/media/uploadVideo", {
    method: "POST",
    headers: { Cookie: cookie, "X-Lock-Client": "web" },
    body: form,
  });
  assert.equal(response.status, 200);
  assert.equal(detected, "video/webm");
});
