import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";

const moment = (id, user = "friend-secret") => ({ canonical_uid: id, user, caption: `Khoảnh khắc ${id}` });
async function fixture(page) {
  await page.route("**/api/auth/session", route => route.fulfill({ json: { authenticated: true, generation: "feed-account", user: { uid: "self-secret" } } }));
  await page.route("**/api/operations/**", route => route.fulfill({ json: { data: [] } }));
  await page.route("**/api/operations/user/getProfile", route => route.fulfill({ json: { data: { uid: "self-secret", first_name: "Minh" } } }));
  await page.route("**/api/operations/friends/getAllFriends", route => route.fulfill({ json: { data: [
    { uid: "friend-secret", first_name: "Linh", last_name: "Nguyễn" },
    { uid: "other-secret", displayName: "Mai" },
  ] } }));
}

test("friends feed opens only as a responsive grid without Reels controls", async ({ page }) => {
  await fixture(page);
  await page.route("**/api/operations/moments/getLatest", route => route.fulfill({ json: { data: [moment("first"), moment("second", "other-secret"), moment("third")] } }));
  await page.goto("/");
  await expect(page.locator(".memory-grid .moment-card")).toHaveCount(3);
  await expect(page.locator(".reels-viewer, .memory-controls")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Lướt từng tin", exact: true })).toHaveCount(0);
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    const columns = await page.locator(".memory-grid").evaluate(el => getComputedStyle(el).gridTemplateColumns.split(" ").length);
    expect(columns).toBe(width > 600 ? 2 : 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test("grid uses the history cursor, preserves comment receivers and ends without inventing a cursor", async ({ page }) => {
  await fixture(page);
  const inputs = [];
  await page.route("**/api/operations/moments/getLatest", route => {
    const body = route.request().postDataJSON(); inputs.push(body);
    return route.fulfill({ json: { data: {
      moments: body.pageToken === "history.last-document" ? [moment("third")] : body.pageToken === "history.next-document" ? [moment("second", "other-secret")] : [moment("first")],
      nextPageToken: !body.pageToken ? "history.cursor_with-true-document-date" : body.pageToken === "history.last-document" ? null : body.pageToken === "history.next-document" ? "history.last-document" : "history.next-document",
    } } });
  });
  await page.goto("/");
  const more = page.getByRole("button", { name: "Tải thêm khoảnh khắc", exact: true });
  await more.click();
  await expect.poll(() => inputs.length).toBe(2);
  await expect(more).toBeEnabled();
  await more.click();
  await expect(page.locator(".moment-card")).toHaveCount(2);
  expect(inputs).toHaveLength(3);
  await more.click();
  await expect(page.locator(".moment-card")).toHaveCount(3);
  await expect(page.getByRole("button", { name: "Tải thêm khoảnh khắc", exact: true })).toHaveCount(0);
  expect(inputs).toEqual([{ includeHistory: true }, { includeHistory: true, pageToken: "history.cursor_with-true-document-date" }, { includeHistory: true, pageToken: "history.next-document" }, { includeHistory: true, pageToken: "history.last-document" }]);
  const card = page.locator(".moment-card").nth(1);
  await card.getByLabel("Bình luận khoảnh khắc").fill("Thật đẹp!");
  const sent = page.waitForRequest(req => req.url().endsWith("/moments/comment"));
  await card.getByRole("button", { name: "Gửi bình luận", exact: true }).click();
  expect((await sent).postDataJSON()).toMatchObject({ momentUid: "second", receiverUid: "other-secret", text: "Thật đẹp!", fromMemory: true });
});

test("grid keeps native video controls and shows refreshed media without autoplay", async ({ page }, info) => {
  await fixture(page);
  let refreshed = false;
  const clip = execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i", "color=c=gold:s=128x192:d=2", "-f", "lavfi", "-i", "sine=frequency=440:duration=2", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", "-movflags", "frag_keyframe+empty_moov", "-f", "mp4", "pipe:1"], { timeout: 15000 });
  await page.route("**/grid-test.mp4", route => route.fulfill({ contentType: "video/mp4", body: clip }));
  await page.route("**/grid-test.svg", route => route.fulfill({ contentType: "image/svg+xml", body: '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500"><rect width="400" height="500" fill="#bdb0e0"/><circle cx="200" cy="240" r="80" fill="#ffcc66"/></svg>' }));
  await page.route("**/api/operations/moments/getLatest", route => route.fulfill({ json: { data: { moments: [
    { ...moment(refreshed ? "refreshed-video" : "video"), video_url: new URL("/grid-test.mp4", route.request().url()).href },
    { ...moment("photo", "other-secret"), thumbnail_url: new URL("/grid-test.svg", route.request().url()).href },
  ], nextPageToken: null } } }));
  await page.goto("/");
  const video = page.locator(".moment-card video");
  await video.scrollIntoViewIfNeeded();
  expect(await video.evaluate(el => el.paused && !el.muted && el.playsInline && el.controls && !el.autoplay && !el.loop)).toBe(true);
  await video.evaluate(el => { el.muted = true; return el.play(); });
  await expect.poll(() => video.evaluate(el => !el.paused)).toBe(true);
  refreshed = true;
  await page.locator(".feed-panel").getByRole("button", { name: "Tải lại", exact: true }).click();
  await expect(page.locator(".moment-card").first()).toContainText("refreshed-video");
  expect(await video.evaluate(el => el.paused && el.controls && !el.muted)).toBe(true);
  const cards = page.locator(".memory-grid .moment-card");
  await expect(cards).toHaveCount(2);
  for (const height of [568, 400]) {
    await page.setViewportSize({ width: 320, height });
    await expect(cards.nth(1).getByRole("img", { name: "Khoảnh khắc photo", exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await cards.nth(1).screenshot({ path: `/tmp/lock-gold-grid-${info.project.name}.png` });
});

test("unavailable older history keeps latest posts usable and offers a fresh read", async ({ page }) => {
  await fixture(page);
  let unavailable = true;
  await page.route("**/api/operations/moments/getLatest", route => route.fulfill({ json: { data: {
    moments: [moment("latest")], nextPageToken: null, historyUnavailable: unavailable,
  } } }));
  await page.goto("/");
  await expect(page.getByText("Hiện chỉ tải được tin mới nhất.", { exact: false })).toBeVisible();
  const reaction = page.waitForRequest(req => req.url().endsWith("/moments/react"));
  await page.getByRole("button", { name: "Thả tim", exact: true }).click();
  expect((await reaction).postDataJSON().fromMemory).toBe(false);
  unavailable = false;
  await page.locator(".feed-panel").getByRole("button", { name: "Tải lại", exact: true }).click();
  await expect(page.getByText("Hiện chỉ tải được tin mới nhất.", { exact: false })).toHaveCount(0);
});

test("refreshing the grid replaces a longer feed with current posts", async ({ page }) => {
  await fixture(page);
  let refreshed = false;
  await page.route("**/api/operations/moments/getLatest", route => route.fulfill({ json: { data: { moments: refreshed ? [moment("new")] : [moment("first"), moment("second"), moment("third")], nextPageToken: null } } }));
  await page.goto("/");
  await expect(page.locator(".memory-grid .moment-card")).toHaveCount(3);
  refreshed = true;
  await page.locator(".feed-panel").getByRole("button", { name: "Tải lại", exact: true }).click();
  await expect(page.locator(".memory-grid .moment-card")).toHaveCount(1);
  await expect(page.locator(".moment-card")).toContainText("Khoảnh khắc new");
  await expect(page.locator(".moment-card")).not.toContainText("Khoảnh khắc first");
});

test("friend names resolve from UID and more pages append without duplicates", async ({ page }) => {
  await fixture(page);
  const inputs = [];
  await page.route("**/api/operations/moments/getLatest", route => {
    const body = route.request().postDataJSON(); inputs.push(body);
    const rows = !body.pageToken ? [moment("first")] : body.pageToken === "first" ? [moment("first"), moment("second", { uid: "other-secret" })] : [moment("second", "other-secret")];
    return route.fulfill({ json: { data: rows } });
  });
  await page.goto("/");
  const cards = page.locator(".moment-card");
  await expect(cards.first().getByRole("heading", { name: "Linh Nguyễn", exact: true })).toBeVisible();
  const more = page.getByRole("button", { name: "Tải thêm khoảnh khắc", exact: true });
  await more.click();
  await expect(cards).toHaveCount(2);
  await expect(cards.nth(1).getByRole("heading", { name: "Mai", exact: true })).toBeVisible();
  await expect(cards.first()).toContainText("Khoảnh khắc first");
  await expect(cards.getByRole("button", { name: "Xoá", exact: true })).toHaveCount(0);
  await expect(cards.getByLabel("Bình luận khoảnh khắc")).toHaveCount(2);
  await expect(page.locator(".feed-panel")).not.toContainText(/friend-secret|other-secret|self-secret/);
  await more.click();
  await expect(cards).toHaveCount(2);
  await expect(more).toHaveCount(0);
  expect(inputs).toEqual([{ includeHistory: true }, { includeHistory: true, pageToken: "first" }, { includeHistory: true, pageToken: "second" }]);
});

test("failed next page preserves content and retries the same cursor once", async ({ page }) => {
  await fixture(page);
  const tokens = [];
  let fail = true, release;
  const held = new Promise(resolve => { release = resolve; });
  await page.route("**/api/operations/moments/getLatest", async route => {
    const token = route.request().postDataJSON().pageToken; tokens.push(token);
    if (!token) return route.fulfill({ json: { data: [moment("first")] } });
    if (fail) { fail = false; return route.fulfill({ status: 502, json: { error: "fixture unavailable" } }); }
    await held;
    return route.fulfill({ json: { data: [moment("second")] } });
  });
  try {
    await page.goto("/");
    await expect(page.locator(".moment-card")).toHaveCount(1);
    const more = page.getByRole("button", { name: "Tải thêm khoảnh khắc", exact: true });
    await more.click();
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.locator(".moment-card")).toHaveCount(1);
    await more.click();
    await expect(more).toBeDisabled();
    release();
    await expect(page.locator(".moment-card")).toHaveCount(2);
    expect(tokens).toEqual([undefined, "first", "first"]);
  } finally { release(); }
});

test("a late friend profile list cannot enter the signed-out feed", async ({ page }) => {
  await fixture(page);
  let release, calls = 0;
  const held = new Promise(resolve => { release = resolve; });
  await page.route("**/api/operations/friends/getAllFriends", async route => {
    calls++; await held;
    return route.fulfill({ json: { data: [{ uid: "friend-secret", first_name: "Private old name" }] } });
  });
  await page.route("**/api/operations/moments/getLatest", route => route.fulfill({ json: { data: [moment("first")] } }));
  try {
    await page.goto("/");
    await expect.poll(() => calls).toBe(1);
    await page.evaluate(() => window.dispatchEvent(new Event("lock-session-expired")));
    release();
    await expect(page.getByText("Những khoảnh khắc đang chờ bạn", { exact: true })).toBeVisible();
    await expect(page.locator("main")).not.toContainText("Private old name");
    await expect(page.locator(".moment-card")).toHaveCount(0);
  } finally { release(); }
});
