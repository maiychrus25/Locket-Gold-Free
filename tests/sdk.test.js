import test from "node:test";
import assert from "node:assert/strict";
import sdk from "locket.js";
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

test("shared history preserves raw authors and uses an exclusive session-bound Firestore cursor", async (t) => {
  const prefix = "projects/locket-4252a/databases/locket/documents/history/fixture-self/entries/";
  const date = "2026-11-17T10:00:00.123456789Z";
  const documents = Array.from({ length: 20 }, (_, index) => ({
    name: `${prefix}moment-${index}`,
    fields: {
      canonical_uid: { stringValue: `canonical-${index}` },
      user: { stringValue: index % 2 ? "fixture-friend-b" : "fixture-friend-a" },
      date: { timestampValue: date },
      image_url: { stringValue: "https://example.com/image.webp" },
      caption: { stringValue: `Caption ${index}` },
      overlays: { arrayValue: { values: [{ mapValue: { fields: { text: { stringValue: "Overlay" } } } }] } },
    },
  }));
  const client = {
    session: { uid: "fixture-self", getValidToken: async () => "fixture-fresh-token" },
    device: { defaultHeaders: { "User-Agent": "fixture-device" } },
  };
  client.moments = new sdk.MomentsModule(client);
  const requests = [];
  let rows = documents.map(document => ({ document }));
  t.mock.method(globalThis, "fetch", async (url, options) => {
    requests.push(JSON.parse(options.body).structuredQuery);
    assert.equal(url, "https://firestore.googleapis.com/v1/projects/locket-4252a/databases/locket/documents/history/fixture-self:runQuery");
    assert.equal(options.method, "POST");
    assert.equal(options.headers.Authorization, "Bearer fixture-fresh-token");
    assert.equal(options.headers["User-Agent"], "fixture-device");
    assert.ok(options.signal instanceof AbortSignal);
    return Response.json(rows);
  });
  const broken = await client.moments.getMoments();
  assert.equal(broken.moments[0].user_uid, "fixture-self");
  assert.equal(broken.moments[0].user, undefined, "pinned SDK drops the actual author");
  const first = await getLatestPage(client, undefined, true);
  assert.equal(first.moments.length, 20);
  assert.equal(first.moments[0].user, "fixture-friend-a");
  assert.equal(first.moments[1].user_uid, "fixture-friend-b");
  assert.equal(first.moments[0].authorVerified, true);
  assert.equal(first.moments[0].moment_uid, "canonical-0");
  assert.equal(first.moments[0].date, date);
  assert.deepEqual(first.moments[0].overlays, [{ text: "Overlay" }]);
  assert.equal(first.moments[0].image_url, "https://example.com/image.webp");
  assert.equal(first.moments[0].caption, "Caption 0");
  assert.ok(first.nextPageToken.length > 150);
  assert.deepEqual(client.moments.decodeQueryCursor(first.nextPageToken), { date, docName: documents.at(-1).name });
  assert.deepEqual(requests.at(-1), {
    from: [{ collectionId: "entries" }],
    orderBy: [
      { field: { fieldPath: "date" }, direction: "DESCENDING" },
      { field: { fieldPath: "__name__" }, direction: "DESCENDING" },
    ],
    limit: 20,
  });
  rows = [{ document: { name: `${prefix}unknown-author`, fields: { date: { timestampValue: date } } } }];
  const second = await getLatestPage(client, first.nextPageToken, true);
  assert.deepEqual(requests.at(-1).startAt, {
    values: [{ timestampValue: date }, { referenceValue: documents.at(-1).name }], before: false,
  });
  assert.equal(second.nextPageToken, null);
  assert.equal(second.moments[0].moment_uid, "unknown-author");
  assert.equal(second.moments[0].user, null);
  assert.equal(second.moments[0].user_uid, null);
  assert.equal(second.moments[0].authorVerified, false);
  rows = [{ readTime: date }];
  assert.deepEqual(await getLatestPage(client, first.nextPageToken, true), { moments: [], nextPageToken: null });
  const beforeInvalid = requests.length;
  for (const cursor of [
    "not-a-cursor", "x".repeat(4097),
    client.moments.encodeQueryCursor({ date: "invalid", docName: documents[0].name }),
    client.moments.encodeQueryCursor({ date, docName: documents[0].name.replace("fixture-self", "other-account") }),
    client.moments.encodeQueryCursor({ date, docName: `${prefix}nested/document` }),
  ]) await assert.rejects(getLatestPage(client, cursor, true));
  assert.equal(requests.length, beforeInvalid, "invalid cursors must fail before transport");
});

test("shared history continuation rejects provider failures instead of pretending pagination ended", async (t) => {
  const client = {
    session: { uid: "fixture-self", getValidToken: async () => "fixture-token" },
    device: { defaultHeaders: {} },
  };
  client.moments = new sdk.MomentsModule(client);
  const cursor = client.moments.encodeQueryCursor({
    date: "2026-11-17T10:00:00Z",
    docName: "projects/locket-4252a/databases/locket/documents/history/fixture-self/entries/previous-page",
  });
  for (const [status, response] of [
    [403, () => Response.json({ error: "private-provider-detail" }, { status: 403 })],
    [503, () => Response.json({ error: "private-provider-detail" }, { status: 503 })],
    [null, () => new Response("private-provider-detail")],
    [null, () => Response.json({ error: "private-provider-detail" })],
    [null, () => Response.json([{ error: { message: "private-provider-detail" } }])],
    [null, () => { throw new DOMException("private-provider-detail", "TimeoutError"); }],
  ]) {
    const mock = t.mock.method(globalThis, "fetch", response);
    await assert.rejects(getLatestPage(client, cursor, true), error => {
      assert.match(error.message, /khoảnh khắc/);
      assert.doesNotMatch(error.message, /private-provider-detail/);
      assert.equal(error.statusCode, status);
      return true;
    });
    assert.equal(mock.mock.callCount(), 1);
    mock.mock.restore();
  }
});

test("empty first-page history preserves latest while an empty continuation never falls back", async (t) => {
  let latest = [{ canonical_uid: "widget-moment", user: "fixture-friend" }];
  const client = {
    session: { uid: "fixture-self", getValidToken: async () => "fixture-token" },
    device: { defaultHeaders: {} },
  };
  client.moments = new sdk.MomentsModule(client);
  const latestMock = t.mock.method(client.moments, "getLatest", async () => latest);
  t.mock.method(globalThis, "fetch", async () => Response.json([]));
  assert.deepEqual(await getLatestPage(client, undefined, true), {
    moments: latest, nextPageToken: null, historyUnavailable: true,
  });
  latest = [];
  assert.deepEqual(await getLatestPage(client, undefined, true), {
    moments: [], nextPageToken: null, historyUnavailable: true,
  });
  const cursor = client.moments.encodeQueryCursor({
    date: "2026-11-17T10:00:00Z",
    docName: "projects/locket-4252a/databases/locket/documents/history/fixture-self/entries/previous-page",
  });
  assert.deepEqual(await getLatestPage(client, cursor, true), { moments: [], nextPageToken: null });
  assert.equal(latestMock.mock.callCount(), 2);
  const latestFailure = new sdk.LocketAPIError("fixture latest unavailable", 503);
  latestMock.mock.mockImplementation(async () => { throw latestFailure; });
  await assert.rejects(getLatestPage(client, undefined, true), error => error === latestFailure);
  assert.equal(latestMock.mock.callCount(), 3, "a latest failure must propagate without retry");
});

test("only a first-page provider history failure falls back to latest with an explicit notice", async (t) => {
  const latest = [{ canonical_uid: "latest-one", user: "fixture-friend" }];
  const client = {
    session: { uid: "fixture-self", getValidToken: async () => "fixture-token" },
    device: { defaultHeaders: {} },
  };
  client.moments = new sdk.MomentsModule(client);
  const latestMock = t.mock.method(client.moments, "getLatest", async () => latest);
  let status = 503;
  const provider = t.mock.method(globalThis, "fetch", async () => Response.json({ error: "private-history-detail" }, { status }));
  assert.deepEqual(await getLatestPage(client, undefined, true), {
    moments: latest, nextPageToken: null, historyUnavailable: true,
  });
  status = 403;
  assert.deepEqual(await getLatestPage(client, undefined, true), {
    moments: latest, nextPageToken: null, historyUnavailable: true,
  });
  assert.equal(latestMock.mock.callCount(), 2);
  const cursor = client.moments.encodeQueryCursor({
    date: "2026-11-17T10:00:00Z",
    docName: "projects/locket-4252a/databases/locket/documents/history/fixture-self/entries/previous-page",
  });
  await assert.rejects(getLatestPage(client, cursor, true), error => error instanceof sdk.LocketAPIError && error.statusCode === 403);
  status = 401;
  await assert.rejects(getLatestPage(client, undefined, true), error => error instanceof sdk.LocketAPIError && error.statusCode === 401);
  const callsBeforeValidation = provider.mock.callCount();
  await assert.rejects(getLatestPage(client, "invalid-cursor", true), { name: "ZodError" });
  client.session.uid = null;
  await assert.rejects(getLatestPage(client, undefined, true), sdk.AuthenticationError);
  client.session.uid = "fixture-self";
  const auth = t.mock.method(client.session, "getValidToken", async () => { throw new sdk.AuthenticationError("fixture expired session"); });
  await assert.rejects(getLatestPage(client, undefined, true), sdk.AuthenticationError);
  auth.mock.restore();
  assert.equal(provider.mock.callCount(), callsBeforeValidation);
  assert.equal(latestMock.mock.callCount(), 2, "continuation, validation and auth failures must not fall back");
  status = 503;
  const latestFailure = new sdk.LocketAPIError("fixture latest unavailable", 502);
  latestMock.mock.mockImplementation(async () => { throw latestFailure; });
  await assert.rejects(getLatestPage(client, undefined, true), error => error === latestFailure);
  latestMock.mock.mockImplementation(async () => ({ error: "private-latest-detail" }));
  await assert.rejects(getLatestPage(client, undefined, true), error => {
    assert.doesNotMatch(error.message, /private-latest-detail/);
    return error instanceof sdk.LocketAPIError;
  });
});

test("real SDK authenticates, refreshes, uploads and handles failure over local HTTP", async (t) => {
  let failPost = false;
  let failHistory = false;
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
    if (req.url.includes("/documents/history/test-user:runQuery")) {
      if (failHistory) {
        res.statusCode = 503;
        return res.end(JSON.stringify({ error: "private-history-provider-detail" }));
      }
      return res.end(JSON.stringify([{ document: {
        name: "projects/locket-4252a/databases/locket/documents/history/test-user/entries/history-one",
        fields: { user: { stringValue: "friend-user" }, date: { timestampValue: "2026-11-17T10:00:00Z" } },
      } }]));
    }
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
  const history = await send("/api/operations/moments/getLatest", { includeHistory: true });
  assert.equal(history.status, 200);
  const historyData = (await history.json()).data;
  assert.equal(historyData.moments[0].user, "friend-user");
  assert.equal(historyData.moments[0].authorVerified, true);
  assert.equal(historyData.nextPageToken, null);
  failHistory = true;
  const historyFallback = await send("/api/operations/moments/getLatest", { includeHistory: true });
  assert.equal(historyFallback.status, 200);
  assert.deepEqual((await historyFallback.json()).data, {
    moments: [{ canonical_uid: "sdk-first", user: "friend-user" }],
    nextPageToken: null,
    historyUnavailable: true,
  });
  const historyFailure = await send("/api/operations/moments/getLatest", {
    includeHistory: true,
    pageToken: resource.client.moments.encodeQueryCursor({
      date: "2026-11-17T10:00:00Z",
      docName: "projects/locket-4252a/databases/locket/documents/history/test-user/entries/history-one",
    }),
  });
  assert.equal(historyFailure.status, 502);
  const historyError = await historyFailure.json();
  assert.equal(historyError.upstreamStatus, 503);
  assert.doesNotMatch(JSON.stringify(historyError), /private-history-provider-detail/);
  failHistory = false;
  assert.ok(Array.isArray((await (await send("/api/operations/moments/getLatest", { includeHistory: false })).json()).data));
  for (const values of [
    { pageToken: "x".repeat(151) },
    { pageToken: "https://attacker.example" },
    { includeHistory: true, pageToken: "not-a-cursor" },
    { includeHistory: true, pageToken: resource.client.moments.encodeQueryCursor({
      date: "2026-11-17T10:00:00Z",
      docName: "projects/locket-4252a/databases/locket/documents/history/other-user/entries/another-moment",
    }) },
    { includeHistory: "true" },
  ]) assert.equal((await send("/api/operations/moments/getLatest", values)).status, 400);
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
