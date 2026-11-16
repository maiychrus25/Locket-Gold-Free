import { test, expect } from "@playwright/test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const navigation = [
  "Tổng quan",
  "Tạo khoảnh khắc",
  "Bạn bè",
  "Tin nhắn",
  "Hồ sơ của tôi",
  "Công cụ nâng cao",
];
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=",
  "base64",
);
const go = (page, name) =>
  page
    .getByRole("navigation")
    .getByRole("button", { name, exact: true })
    .click();
let scratch;
let videoPath;
test.beforeAll(async () => {
  scratch = await mkdtemp(join(tmpdir(), "lock-gold-browser-"));
  videoPath = join(scratch, "clip.mp4");
  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-f",
      "lavfi",
      "-i",
      "color=c=gold:s=128x128:d=2",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      videoPath,
    ],
    { stdio: "ignore", timeout: 10000 },
  );
});
test.afterAll(async () => {
  if (scratch) await rm(scratch, { recursive: true, force: true });
});
test.afterEach(async ({ page }) => {
  await page.request.post("/api/auth/logout", {
    headers: { "X-Lock-Client": "web" },
    data: {},
  });
});

async function signedIn(page) {
  const response = await page.request.post("/api/auth/login", {
    headers: { "X-Lock-Client": "web" },
    data: { email: "test@example.com", password: "test-password" },
  });
  expect(response.status()).toBe(200);
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Hồ sơ", exact: true }),
  ).toBeVisible();
}

async function noOverflow(page) {
  const widths = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(widths.scroll).toBeLessThanOrEqual(widths.client + 1);
  const overlap = await page.evaluate(() => {
    const footer = document.querySelector(".welcome-foot");
    const photo = document.querySelector(".photo-card.back");
    if (innerWidth > 480 || !footer || !photo) return false;
    const text = footer.getBoundingClientRect();
    const art = photo.getBoundingClientRect();
    return text.bottom > art.top && text.right > art.left;
  });
  expect(overlap, "Hero artwork must not cover the privacy text").toBe(false);
}

test("guest navigation, theme, empty states and minimum width stay usable", async ({
  page,
}, info) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Những điều nhỏ, thật gần." }),
  ).toBeVisible();
  for (const name of navigation) {
    await go(page, name);
    await noOverflow(page);
  }
  await go(page, "Tổng quan");
  const theme = await page.locator("html").getAttribute("data-theme");
  const toggle = page
    .getByRole("button", { name: /giao diện/i })
    .filter({ visible: true })
    .first();
  await toggle.click();
  await expect(page.locator("html")).not.toHaveAttribute("data-theme", theme);
  await page.reload();
  await expect(page.locator("html")).not.toHaveAttribute("data-theme", theme);
  await page.screenshot({
    path: info.outputPath("workspace.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 320, height: 780 });
  for (const name of navigation) {
    await go(page, name);
    await noOverflow(page);
  }
  expect(errors).toEqual([]);
});

test("login dialog supports keyboard, safe cookie and logout", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Kết nối tài khoản", exact: true })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Kết nối tài khoản", exact: true })
    .first()
    .click();
  await page.getByLabel("Email", { exact: true }).fill("test@example.com");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("test-password");
  const loggedIn = page.waitForResponse((response) =>
    response.url().endsWith("/api/auth/login"),
  );
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Kết nối tài khoản", exact: true })
    .click();
  const login = await loggedIn;
  expect(login.status()).toBe(200);
  expect(await login.text()).not.toContain("fixture-id-token");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const cookie = (await page.context().cookies()).find(
    (cookie) => cookie.name === "lock_session",
  );
  expect(cookie.httpOnly).toBe(true);
  expect(cookie.sameSite).toBe("Strict");
  await go(page, "Hồ sơ của tôi");
  await page
    .getByRole("button", { name: "Đăng xuất", exact: true })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("button", { name: /Đăng xuất|Xác nhận/, exact: false })
    .last()
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page
      .getByRole("button", { name: "Kết nối tài khoản", exact: true })
      .first(),
  ).toBeVisible();
  expect(
    (
      await page.request
        .get("/api/auth/session")
        .then((response) => response.json())
    ).authenticated,
  ).toBe(false);
});

test("every SDK operation is reachable through its typed tool form", async ({
  page,
}) => {
  await signedIn(page);
  await go(page, "Công cụ nâng cao");
  const catalog = await page.request
    .get("/api/catalog")
    .then((response) => response.json());
  const select = page.locator(".operation-select select");
  await expect(select.locator("option")).toHaveCount(catalog.operations.length);
  for (const operation of catalog.operations) {
    await select.selectOption(`${operation.group}.${operation.method}`);
    if (operation.stream)
      await expect(
        page
          .getByRole("heading", { name: "Tin nhắn trực tiếp", exact: true })
          .first(),
      ).toBeVisible();
    else
      await expect(page.locator(".operation-heading h3")).toHaveText(
        operation.label,
      );
    await noOverflow(page);
  }
});

test("photo preview, private post and upstream-error retry preserve the draft", async ({
  page,
}) => {
  await signedIn(page);
  await go(page, "Tạo khoảnh khắc");
  await expect(page.locator(".operation-select select")).toHaveValue(
    "moments.post",
  );
  await page.locator("input[type=file]").first().setInputFiles({
    name: "snapshot.png",
    mimeType: "image/png",
    buffer: png,
  });
  await expect(page.getByAltText("Xem trước khoảnh khắc")).toBeVisible();
  await page.getByLabel("Chú thích", { exact: true }).fill("Một ngày thật vui");
  await page.getByLabel("Chỉ mình tôi", { exact: true }).check();
  await page.route("**/api/media/post", (route) =>
    route.fulfill({
      status: 502,
      contentType: "application/json",
      body: JSON.stringify({
        error: "Fixture upstream temporarily unavailable",
      }),
    }),
  );
  await page
    .getByRole("button", { name: "Đăng khoảnh khắc ảnh / video", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("Fixture upstream");
  await expect(page.getByLabel("Chú thích", { exact: true })).toHaveValue(
    "Một ngày thật vui",
  );
  await expect(page.getByAltText("Xem trước khoảnh khắc")).toBeVisible();
  await page.unroute("**/api/media/post");
  const posted = page.waitForResponse((response) =>
    response.url().endsWith("/api/media/post"),
  );
  await page
    .getByRole("button", { name: "Đăng khoảnh khắc ảnh / video", exact: true })
    .click();
  const response = await posted;
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.data.canonical_uid).toMatch(/^test-moment-/);
  expect(body.data.sent_to_self_only).toBe(true);
  expect(body.data.sent_to_all).toBe(false);
  await expect(
    page.getByText("Máy chủ đã phản hồi", { exact: false }).first(),
  ).toBeVisible();
  await noOverflow(page);
});

test("chat keeps failed text, sends successfully and loads real SDK local history", async ({
  page,
}) => {
  await signedIn(page);
  await go(page, "Tin nhắn");
  await page.getByLabel("UID người nhận tin nhắn").fill("friend-user");
  const text = page.locator(".chat-layout textarea");
  await text.fill("trigger-upstream-error");
  await page.getByRole("button", { name: "Gửi tin nhắn", exact: true }).click();
  await expect(page.getByRole("alert").first()).toContainText(
    "Temporary upstream",
  );
  await expect(text).toHaveValue("trigger-upstream-error");
  await text.fill("Chào bạn từ Lock Gold Free");
  const sending = page.waitForResponse((response) =>
    response.url().endsWith("/api/operations/chat/sendMessage"),
  );
  await page.getByRole("button", { name: "Gửi tin nhắn", exact: true }).click();
  expect((await sending).status()).toBe(200);
  await expect(text).toHaveValue("");
  await expect(page.locator(".message").first()).toContainText(
    "Chào bạn từ Lock Gold Free",
  );
  await noOverflow(page);
});

test("session expiry hides account data and prompts reconnection", async ({
  page,
}) => {
  await signedIn(page);
  await go(page, "Công cụ nâng cao");
  await page
    .locator(".operation-select select")
    .selectOption("user.getProfile");
  await page.request.post("/api/auth/logout", {
    headers: { "X-Lock-Client": "web" },
    data: {},
  });
  await page
    .getByRole("button", { name: "Xem hồ sơ theo UID", exact: true })
    .click();
  await expect(
    page
      .getByRole("button", { name: "Kết nối tài khoản", exact: true })
      .first(),
  ).toBeVisible();
  await expect(page.locator(".profile-summary")).toHaveCount(0);
  await noOverflow(page);
});

test("video accepts a custom thumbnail and compression priority", async ({
  page,
}) => {
  await signedIn(page);
  await go(page, "Tạo khoảnh khắc");
  await page.locator("input[type=file]").first().setInputFiles(videoPath);
  await expect(page.locator(".preview video")).toBeVisible();
  await page
    .getByLabel("Ảnh bìa video riêng (tuỳ chọn)")
    .setInputFiles({ name: "cover.png", mimeType: "image/png", buffer: png });
  await page.getByLabel("Ưu tiên nén", { exact: true }).selectOption("audio");
  const uploaded = page.waitForResponse((response) =>
    response.url().endsWith("/api/media/post"),
  );
  await page
    .getByRole("button", { name: "Đăng khoảnh khắc ảnh / video", exact: true })
    .click();
  const response = await uploaded;
  expect(response.status()).toBe(200);
  expect((await response.json()).data.video_url).toContain("locket-video");
  await noOverflow(page);
});

test("SDK feed shapes render media, reactions and usable history pagination", async ({
  page,
}) => {
  const moment = (id, caption) => ({
    canonical_uid: id,
    user: "friend-user",
    caption,
    thumbnail_url: "http://127.0.0.1:4319/test-photo.svg",
  });
  await page.route("**/test-photo.svg", (route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240"><rect width="240" height="240" fill="#f4c542"/></svg>',
    }),
  );
  await page.route("**/api/operations/moments/getLatest", (route) =>
    route.fulfill({
      json: { data: [moment("first-moment", "Khoảnh khắc đầu tiên")] },
    }),
  );
  await page.route("**/api/operations/moments/getMoments", (route) => {
    const next = route.request().postDataJSON()?.pageToken;
    return route.fulfill({
      json: {
        data: {
          moments: [
            {
              ...moment(
                next ? "second-moment" : "history-one",
                next ? "Trang tiếp theo" : "Lịch sử đầu tiên",
              ),
              user: "test-account-uid",
              authorVerified: true,
            },
          ],
          nextPageToken: next ? null : "history-cursor",
        },
      },
    });
  });
  await signedIn(page);
  await expect(page.locator(".moment-card")).toContainText(
    "Khoảnh khắc đầu tiên",
  );
  await expect(page.locator(".moment-card img")).toBeVisible();
  const reacting = page.waitForRequest((request) =>
    request.url().endsWith("/api/operations/moments/react"),
  );
  await page.getByRole("button", { name: "Thả tim", exact: true }).click();
  expect((await reacting).postDataJSON()).toEqual({
    momentUid: "first-moment",
    reaction: "❤️",
    fromMemory: false,
  });
  await page.getByRole("tab", { name: "Lịch sử của tôi", exact: true }).click();
  await expect(page.locator(".moment-card")).toContainText("Lịch sử đầu tiên");
  await page
    .getByRole("button", { name: "Trang tiếp theo", exact: true })
    .click();
  await expect(page.locator(".moment-card")).toContainText("Trang tiếp theo");
  await expect(
    page.getByRole("button", { name: "Trang tiếp theo", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Xoá", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await noOverflow(page);
});

test("incoming and outgoing friend requests keep their direction and action", async ({
  page,
}) => {
  await page.route("**/api/operations/friends/getFriendRequests", (route) =>
    route.fulfill({
      json: {
        data: {
          incoming: [{ uid: "friend-incoming", first_name: "Linh" }],
          outgoing: [{ uid: "friend-outgoing", first_name: "Nam" }],
        },
      },
    }),
  );
  await signedIn(page);
  await go(page, "Bạn bè");
  await page.getByRole("button", { name: "Lời mời", exact: true }).click();
  await expect(page.locator(".person-card")).toHaveCount(2);
  const incoming = page
    .locator(".person-card")
    .filter({ has: page.getByText("Linh", { exact: true }) });
  const outgoing = page
    .locator(".person-card")
    .filter({ has: page.getByText("Nam", { exact: true }) });
  await expect(
    incoming.getByRole("button", { name: "Chấp nhận", exact: true }),
  ).toBeEnabled();
  await expect(
    outgoing.getByRole("button", { name: "Chấp nhận", exact: true }),
  ).toBeDisabled();
  const accepting = page.waitForRequest((request) =>
    request.url().endsWith("/api/operations/friends/acceptRequest"),
  );
  await incoming
    .getByRole("button", { name: "Chấp nhận", exact: true })
    .click();
  expect((await accepting).postDataJSON()).toEqual({
    userUid: "friend-incoming",
  });
  await noOverflow(page);
});

test("another tab replacing the account cannot submit the old media draft", async ({
  page,
}) => {
  await signedIn(page);
  await go(page, "Tạo khoảnh khắc");
  await page
    .locator("input[type=file]")
    .first()
    .setInputFiles({ name: "private.png", mimeType: "image/png", buffer: png });
  await page
    .getByLabel("Chú thích", { exact: true })
    .fill("Private draft from old account");
  const changed = await page.request.post("/api/auth/login", {
    headers: { "X-Lock-Client": "web" },
    data: { email: "other@example.com", password: "test-password" },
  });
  expect(changed.status()).toBe(200);
  const rejected = page.waitForResponse((response) =>
    response.url().endsWith("/api/media/post"),
  );
  await page
    .getByRole("button", { name: "Đăng khoảnh khắc ảnh / video", exact: true })
    .click();
  expect((await rejected).status()).toBe(409);
  await expect(
    page
      .getByRole("button", { name: "Kết nối tài khoản", exact: true })
      .first(),
  ).toBeVisible();
  await page.reload();
  await go(page, "Tạo khoảnh khắc");
  await expect(page.getByLabel("Chú thích", { exact: true })).toBeEmpty();
});

test("an upstream publishing gateway error preserves the draft and warns about duplicate posts", async ({
  page,
}) => {
  await signedIn(page);
  await go(page, "Tạo khoảnh khắc");
  await page
    .locator("input[type=file]")
    .first()
    .setInputFiles({ name: "draft.png", mimeType: "image/png", buffer: png });
  const caption = page.getByLabel("Chú thích", { exact: true });
  await caption.fill("trigger-gateway-error");
  let requests = 0;
  page.on("request", (request) => {
    if (request.url().endsWith("/api/media/post")) requests++;
  });
  const result = page.waitForResponse((response) =>
    response.url().endsWith("/api/media/post"),
  );
  await page
    .getByRole("button", { name: "Đăng khoảnh khắc ảnh / video", exact: true })
    .click();
  const response = await result;
  expect(response.status()).toBe(502);
  expect(await response.json()).toMatchObject({
    code: "UPSTREAM_UNAVAILABLE",
    upstreamStatus: 502,
    outcome: "unknown",
  });
  await expect(page.getByRole("alert")).toContainText(
    "Chưa xác nhận thao tác thành công",
  );
  await expect(page.getByRole("alert")).toContainText("kiểm tra lịch sử");
  await expect(caption).toHaveValue("trigger-gateway-error");
  await expect(page.getByAltText("Xem trước khoảnh khắc")).toBeVisible();
  await expect(
    page.getByText("Máy chủ đã phản hồi", { exact: false }),
  ).toHaveCount(0);
  await page.waitForTimeout(200);
  expect(requests).toBe(1);
  await noOverflow(page);
});
