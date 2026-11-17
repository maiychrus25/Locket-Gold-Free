import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { existsSync } from "node:fs";
import { dirname } from "node:path";
import { createApp } from "../server/app.js";
import { createSdkSession, getLatestPage } from "../server/services/locket/client.js";
import { useLocalUpstream } from "./upstream.js";
import { executeMedia } from "../server/services/locket/media-worker.js";

test("feed continuation does not turn malformed provider results into an empty feed", async () => {
  for (const result of [undefined, { data: null }, { status: 500, error: "private provider message" }, { status: 503, data: [] }])
    await assert.rejects(getLatestPage({ postApi: async () => result }, "cursor"), error => {
      assert.match(error.message, /khoảnh khắc/);
      assert.doesNotMatch(error.message, /private provider message/);
      return true;
    });
  assert.deepEqual(await getLatestPage({ postApi: async () => ({ status: 304 }) }, "cursor"), []);
  const cached = [{canonical_uid:"cached"}];
  assert.deepEqual(await getLatestPage({ postApi: async () => ({ status: 304, data: cached }) }, "cursor"), cached);
});

test("real SDK authenticates, refreshes, uploads and handles failure over local HTTP", async (t) => {
  let failPost = false;
  const upstream = createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks).toString();
    observed.push({ path: req.url, method: req.method, body });
    res.setHeader("Content-Type", "application/json");
    if (req.url.includes("signInWithPassword"))
      return res.end(
        JSON.stringify({
          localId: "test-user",
          email: "test@example.com",
          idToken: "sdk-private-token",
          refreshToken: "sdk-private-refresh",
          expiresIn: "3600",
        }),
      );
    if (req.url.includes("securetoken.googleapis.com"))
      return res.end(
        JSON.stringify({
          id_token: "sdk-new-private-token",
          refresh_token: "sdk-private-refresh",
          expires_in: "3600",
        }),
      );
    if (req.url.endsWith("fetchUserV2"))
      return res.end(
        JSON.stringify({
          result: { data: { uid: "test-user", first_name: "Test" } },
        }),
      );
    if (req.url.includes("accounts:lookup"))
      return res.end(JSON.stringify({ users: [] }));
    if (req.url.endsWith("getLatestMomentV2"))
      return res.end(JSON.stringify({ result: { status: 200, data: [{ canonical_uid: JSON.parse(body).data.sync_token ? "sdk-older" : "sdk-first", user: "friend-user" }] } }));
    if (req.url.endsWith("sendChatMessageV2")) {
      res.statusCode = 503;
      return res.end(JSON.stringify({ error: "upstream unavailable" }));
    }
    if (
      req.url.startsWith("/firebasestorage.googleapis.com/") &&
      req.method === "POST"
    ) {
      res.setHeader(
        "x-goog-upload-url",
        `http://127.0.0.1:${upstream.address().port}/upload`,
      );
      return res.end("{}");
    }
    if (req.url === "/upload")
      return res.end(JSON.stringify({ downloadTokens: "media-download" }));
    if (req.url.endsWith("postMomentV2") && failPost) {
      res.writeHead(502, { "Content-Type": "text/html" });
      return res.end("<html><title>502</title>Bad Gateway</html>");
    }
    if (req.url.endsWith("postMomentV2"))
      return res.end(
        JSON.stringify({
          result: { status: 200, data: { canonical_uid: "sdk-moment" } },
        }),
      );
    res.statusCode = 501;
    res.end("{}");
  });
  const observed = [];
  upstream.listen(0, "127.0.0.1");
  await once(upstream, "listening");
  const restore = useLocalUpstream(
    `http://127.0.0.1:${upstream.address().port}`,
  );
  let resource;
  const app = createApp({
    createClient: async () => {
      resource = await createSdkSession();
      return resource;
    },
    mediaExecutor: executeMedia,
  });
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(async () => {
    await app.locals.shutdown();
    restore();
    for (const item of [upstream, server]) {
      item.closeAllConnections();
      await new Promise((resolve) => item.close(resolve));
    }
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  let cookie;
  const send = (path, body) =>
    fetch(base + path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Lock-Client": "web",
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: JSON.stringify(body),
    });
  const login = await send("/api/auth/login", {
    email: "test@example.com",
    password: "test-password",
  });
  assert.equal(login.status, 200);
  cookie = login.headers.get("set-cookie").split(";")[0];
  const latest = await send("/api/operations/moments/getLatest", {});
  assert.equal(latest.status, 200);
  assert.equal((await latest.json()).data[0].canonical_uid, "sdk-first");
  const older = await send("/api/operations/moments/getLatest", {pageToken:"sdk-first"});
  assert.equal(older.status, 200);
  assert.equal((await older.json()).data[0].canonical_uid, "sdk-older");
  const feedBodies = observed.filter(item => item.path.endsWith("getLatestMomentV2")).map(item => JSON.parse(item.body).data);
  assert.equal(feedBodies[0].sync_token, undefined);
  const { analytics, ...continuation } = feedBodies[1];
  assert.deepEqual(continuation, {should_count_missed_moments:true,include_group_moments:true,sync_token:"sdk-first"});
  assert.equal(analytics.platform, "ios");
  assert.equal(
    existsSync(resource.client.session.sessionPath),
    false,
    "SDK tokens must not be saved to disk",
  );
  const profile = await send("/api/operations/user/getProfile", {});
  assert.equal((await profile.json()).data.first_name, "Test");
  assert.equal((await send("/api/operations/session/refresh", {})).status, 200);
  const failing = await send("/api/operations/chat/sendMessage", {
    receiverUid: "friend-user",
    text: "hello",
  });
  assert.equal(failing.status, 502);
  assert.equal((await failing.text()).includes("sdk-new-private-token"), false);
  const form = new FormData();
  form.append(
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
  form.append(
    "options",
    JSON.stringify({ caption: "A moment", isPrivate: true }),
  );
  const posted = await fetch(base + "/api/media/post", {
    method: "POST",
    headers: { Cookie: cookie, "X-Lock-Client": "web" },
    body: form,
  });
  assert.equal(posted.status, 200);
  assert.equal((await posted.json()).data.canonical_uid, "sdk-moment");
  const post = JSON.parse(
    observed.find((value) => value.path.endsWith("postMomentV2")).body,
  );
  assert.equal(post.data.sent_to_self_only, true);
  assert.equal(post.data.sent_to_all, false);
  assert.ok(post.data.thumbnail_url.includes("media-download"));
  failPost = true;
  const gatewayFailure = await fetch(base + "/api/media/post", {
    method: "POST",
    headers: { Cookie: cookie, "X-Lock-Client": "web" },
    body: form,
  });
  assert.equal(gatewayFailure.status, 502);
  const gatewayError = await gatewayFailure.json();
  assert.equal(gatewayError.code, "UPSTREAM_UNAVAILABLE");
  assert.equal(gatewayError.upstreamStatus, 502);
  assert.equal(gatewayError.outcome, "unknown");
  assert.equal(
    observed.filter((value) => value.path.endsWith("postMomentV2")).length,
    2,
  );
  const directory = dirname(resource.client.session.sessionPath);
  await send("/api/auth/logout", {});
  assert.equal(
    existsSync(directory),
    false,
    "Logout must remove SDK history directory",
  );
  assert.ok(
    observed.some((value) => value.path.includes("securetoken.googleapis.com")),
  );
  assert.ok(
    observed.some(
      (value) => value.path === "/upload" && value.method === "PUT",
    ),
  );
});
