import { test, expect } from "@playwright/test";

const go = (page, name) => page.getByRole("navigation").getByRole("button", { name, exact: true }).click();
async function signedIn(page) {
  const response = await page.request.post("/api/auth/login", {
    headers: { "X-Lock-Client": "web" },
    data: { email: "test@example.com", password: "test-password" },
  });
  expect(response.status()).toBe(200);
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Hồ sơ", exact: true })).toBeVisible();
}
test.afterEach(async ({ page }) => {
  await page.request.post("/api/auth/logout", { headers: { "X-Lock-Client": "web" }, data: {} });
});

test("free guide opens real features without prices or technical output", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Tính năng miễn phí", exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "Một không gian. Không paywall.", exact: true })).toBeVisible();
  await expect(page.locator(".capability-card")).toHaveCount(9);
  await expect(page.locator("body")).not.toContainText(/\b(?:SDK|API|JSON|UID|HTTP|cookie|token)\b/i);
  await expect(page.locator("pre, code")).toHaveCount(0);
  await page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Ảnh từ thư viện", exact: true }) }).getByRole("button", { name: "Tạo khoảnh khắc" }).click();
  await expect(page.locator(".operation-select select")).toHaveValue("moments.post");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("profile editor sends only entered fields and retains edits on upstream rejection", async ({ page }) => {
  await signedIn(page);
  await go(page, "Hồ sơ của tôi");
  await expect(page.getByLabel("Tên của bạn", { exact: true })).toHaveValue("Minh");
  await page.getByLabel("Tên của bạn", { exact: true }).fill("Linh");
  await page.route("**/api/operations/user/updateProfile", route => route.fulfill({ status: 502, json: { error: "Profile temporarily unavailable" } }));
  await page.getByRole("button", { name: "Lưu hồ sơ", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Kết nối đang gián đoạn");
  await expect(page.getByLabel("Tên của bạn", { exact: true })).toHaveValue("Linh");
  await go(page, "Bạn bè");
  await go(page, "Hồ sơ của tôi");
  await expect(page.getByLabel("Tên của bạn", { exact: true })).toHaveValue("Linh");
  await page.unroute("**/api/operations/user/updateProfile");
  const update = page.waitForRequest(request => request.url().endsWith("/api/operations/user/updateProfile"));
  await page.getByRole("button", { name: "Lưu hồ sơ", exact: true }).click();
  expect((await update).postDataJSON()).toEqual({ profile: { first_name: "Linh" } });
  await expect(page.getByRole("status").filter({ hasText: "Đã cập nhật hồ sơ" })).toBeVisible();
});

test("saving a birthday sends only that edit and cannot overwrite the current name", async ({ page }) => {
  await signedIn(page);
  await go(page, "Hồ sơ của tôi");
  await expect(page.getByLabel("Tên của bạn", { exact: true })).toHaveValue("Minh");
  await page.getByLabel("Sinh nhật", { exact: true }).fill("2000-01-02");
  const update = page.waitForRequest(request => request.url().endsWith("/api/operations/user/updateProfile"));
  await page.getByRole("button", { name: "Lưu hồ sơ", exact: true }).click();
  expect((await update).postDataJSON()).toEqual({ profile: { birthdate: "2000-01-02" } });
});

test("a late profile save cannot discard an edit made after navigating back", async ({ page }) => {
  await signedIn(page);
  let finish;
  let requested = false;
  const held = new Promise(resolve => { finish = resolve; });
  await page.route("**/api/operations/user/updateProfile", async route => {
    requested = true;
    await held;
    await route.fulfill({ json: { data: { status: 200 } } });
  });
  try {
    await go(page, "Hồ sơ của tôi");
    await expect(page.getByLabel("Tên của bạn", { exact: true })).toBeEnabled();
    await page.getByLabel("Tên của bạn", { exact: true }).fill("First edit");
    await page.getByRole("button", { name: "Lưu hồ sơ", exact: true }).click();
    await expect.poll(() => requested).toBe(true);
    await go(page, "Bạn bè");
    await go(page, "Hồ sơ của tôi");
    await expect(page.getByLabel("Tên của bạn", { exact: true })).toBeEnabled();
    await page.getByLabel("Tên của bạn", { exact: true }).fill("Newer edit");
    const saved = page.waitForResponse(response => response.url().endsWith("/api/operations/user/updateProfile"));
    finish();
    await saved;
    await expect(page.getByLabel("Tên của bạn", { exact: true })).toHaveValue("Newer edit");
    await go(page, "Bạn bè");
    await go(page, "Hồ sơ của tôi");
    await expect(page.getByLabel("Tên của bạn", { exact: true })).toHaveValue("Newer edit");
  } finally { finish(); }
});

test("web appearance persists without changing account or charging for a theme", async ({ page }) => {
  await signedIn(page);
  await go(page, "Hồ sơ của tôi");
  await page.getByRole("button", { name: "Sắc hồng", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-accent", "rose");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-accent", "rose");
  await go(page, "Hồ sơ của tôi");
  await page.getByRole("button", { name: "Biển xanh", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-accent", "ocean");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("daily pages render human content without response JSON, internal identifiers or protocol labels", async ({ page }) => {
  await page.route("**/api/operations/moments/getLatest", route => route.fulfill({ json: { data: [{
    canonical_uid: "internal-moment-do-not-show",
    user: { uid: "internal-person-do-not-show", displayName: "Linh" },
    caption: "Một ngày nhiều niềm vui",
    diagnostic: { marker: "raw-response-do-not-show" },
  }] } }));
  await signedIn(page);
  await expect(page.getByText("Một ngày nhiều niềm vui", { exact: true })).toBeVisible();
  for (const name of ["Tổng quan", "Tạo khoảnh khắc", "Bạn bè", "Tin nhắn", "Hồ sơ của tôi", "Tiện ích"]) {
    await go(page, name);
    await expect(page.locator("pre, code")).toHaveCount(0);
    await expect(page.locator("body")).not.toContainText(/raw-response-do-not-show|internal-(?:moment|person)-do-not-show|\b(?:API|SDK|JSON|UID|HTTP|HEVC|cookie|token)\b/i);
  }
});
