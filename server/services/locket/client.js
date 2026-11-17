import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sdk from "locket.js";
import { z } from "zod";

async function getHistoryPage(client, pageToken) {
  const uid = client.session.uid;
  if (!uid) throw new sdk.AuthenticationError("Not authenticated");
  const parent = `projects/locket-4252a/databases/locket/documents/history/${uid}`;
  const prefix = `${parent}/entries/`;
  const cursor = pageToken ? z.object({
    date: z.iso.datetime({ offset: true }),
    docName: z.string().refine(name => name.startsWith(prefix) && /^[^/]+$/.test(name.slice(prefix.length))),
  }).strict().parse(client.moments.decodeQueryCursor(
    z.string().max(4096).regex(/^[\w-]+$/).parse(pageToken),
  )) : null;
  const structuredQuery = {
    from: [{ collectionId: "entries" }],
    orderBy: [
      { field: { fieldPath: "date" }, direction: "DESCENDING" },
      { field: { fieldPath: "__name__" }, direction: "DESCENDING" },
    ],
    limit: 20,
    ...(cursor && { startAt: {
      values: [{ timestampValue: cursor.date }, { referenceValue: cursor.docName }],
      before: false,
    } }),
  };
  const token = await client.session.getValidToken();
  let response;
  let rows;
  try {
    response = await fetch(`https://firestore.googleapis.com/v1/${parent}:runQuery`, {
      method: "POST",
      headers: { ...client.device.defaultHeaders, Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ structuredQuery }),
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) throw new Error();
    rows = await response.json();
    if (!Array.isArray(rows) || rows.some(row => !row || typeof row !== "object" || row.error || (!row.document && !row.readTime)))
      throw new Error();
  } catch {
    throw new sdk.LocketAPIError("Chưa tải được lịch sử khoảnh khắc. Vui lòng thử lại.", response && !response.ok ? response.status : null);
  }
  const documents = rows.flatMap(row => row.document ? [row.document] : []);
  const moments = documents.map(doc => {
    if (typeof doc.name !== "string" || !doc.name.startsWith(prefix) || !/^[^/]+$/.test(doc.name.slice(prefix.length)) || !doc.fields || typeof doc.fields !== "object")
      throw new sdk.LocketAPIError("Dữ liệu lịch sử khoảnh khắc không hợp lệ.");
    const get = key => client.moments.parseFirestoreValue(doc.fields[key]);
    // The pinned SDK discards fields.user and substitutes the history owner's UID.
    const author = get("user");
    const user = typeof author === "string" && author.trim() ? author : null;
    const date = get("date") || client.moments.getDocDateValue(doc);
    const timestamp = new Date(date).getTime();
    return {
      moment_uid: get("canonical_uid") || get("moment_uid") || doc.name.split("/").pop(),
      user,
      user_uid: user,
      authorVerified: Boolean(user),
      thumbnail_url: get("thumbnail_url") || "",
      image_url: get("image_url") || get("thumbnail_url") || "",
      video_url: get("video_url") || "",
      caption: get("caption") || "",
      overlays: get("overlays") || [],
      created_at: Number.isFinite(timestamp) ? String(Math.floor(timestamp / 1000)) : "",
      date,
      md5: get("md5") || "",
    };
  });
  const lastDoc = documents.at(-1);
  return { moments, nextPageToken: documents.length === 20
    ? client.moments.encodeQueryCursor({ date: client.moments.getDocDateValue(lastDoc), docName: lastDoc.name })
    : null };
}

export async function getLatestPage(client, pageToken, includeHistory = false) {
  if (includeHistory) {
    try {
      const history = await getHistoryPage(client, pageToken);
      if (pageToken || history.moments.length) return history;
    } catch (error) {
      if (pageToken || !(error instanceof sdk.LocketAPIError) || error.statusCode === 401) throw error;
    }
    const moments = await client.moments.getLatest();
    if (!Array.isArray(moments))
      throw new sdk.LocketAPIError("Chưa tải được khoảnh khắc mới nhất. Vui lòng thử lại.");
    return { moments, nextPageToken: null, historyUnavailable: true };
  }
  if (!pageToken) return client.moments.getLatest();
  const result = await client.postApi("getLatestMomentV2", {
    should_count_missed_moments: true,
    include_group_moments: true,
    sync_token: pageToken,
  });
  if (result?.status === 304 && !Array.isArray(result.data)) return [];
  if ((Number.isInteger(result?.status) && result.status >= 400) || !Array.isArray(result?.data)) {
    const error = new Error("Chưa tải được khoảnh khắc tiếp theo. Vui lòng thử lại.");
    if (Number.isInteger(result?.status) && result.status >= 400) error.statusCode = result.status;
    throw error;
  }
  return result.data;
}

export function deviceSummary(client) {
  const device = client.device;
  return {
    autoEmulate: device.autoEmulate,
    installationId: device.installationId,
    modelName: device.modelInfo.name,
    hardwareModel: device.modelInfo.model,
    iosVersion: device.modelInfo.ios,
    appVersion: device.appVersion,
    buildNumber: device.buildNumber,
  };
}

export async function createSdkSession() {
  const directory = await mkdtemp(join(tmpdir(), "lock-gold-session-"));
  const client = new sdk.LocketClient({
    sessionPath: join(directory, "session.json"),
  });
  // The SDK needs a directory for history, but account tokens must remain in memory.
  client.session.save = () => {};
  const getValidToken = client.session.getValidToken.bind(client.session);
  let refreshing;
  client.session.getValidToken = () => {
    refreshing ??= Promise.resolve()
      .then(getValidToken)
      .finally(() => {
        refreshing = undefined;
      });
    return refreshing;
  };
  return {
    client,
    close: async () => {
      client.session.idToken = null;
      client.session.refreshToken = null;
      await rm(directory, { recursive: true, force: true });
    },
  };
}
