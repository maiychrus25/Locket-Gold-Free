import { test, expect } from "@playwright/test";

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
  expect(inputs).toEqual([{}, { pageToken: "first" }, { pageToken: "second" }]);
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
