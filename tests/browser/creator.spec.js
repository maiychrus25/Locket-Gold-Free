import { test, expect } from "@playwright/test";
import { operationMap, validateOperation } from "../../shared/operations.js";

const photo = { name: "memory.png", mimeType: "image/png", buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=", "base64") };
const go = (page, name) => page.getByRole("navigation").getByRole("button", { name, exact: true }).click();
async function openCreator(page) {
  await page.goto("/");
  await go(page, "Tạo khoảnh khắc");
  await page.locator(".operation-select select").selectOption("moments.post");
}
async function mockCamera(page, delayed = false) {
  await page.addInitScript(({ delayed }) => {
    window.cameraCalls = 0;
    window.cameraTracks = [];
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", { value: () => {
      window.cameraCalls++;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 64;
      canvas.getContext("2d").fillRect(0, 0, 64, 64);
      const stream = canvas.captureStream(10);
      window.cameraTracks.push(...stream.getTracks());
      return delayed ? new Promise(resolve => { window.releaseCamera = () => resolve(stream); }) : Promise.resolve(stream);
    } });
  }, { delayed });
}

test("catalog presets and live caption keep original media and reset safely", async ({ page }, info) => {
  await openCreator(page);
  await page.locator('input[type="file"]').first().setInputFiles(photo);
  await expect(page.getByLabel("Chú thích", { exact: true })).toHaveAttribute("maxlength", "2000");
  await page.getByLabel("Chú thích", { exact: true }).fill("Một ngày thật đẹp");
  const chip = page.locator(".creator-presets button").nth(1);
  await chip.click();
  await expect(chip).toHaveAttribute("aria-pressed", "true");
  const preview = page.locator(".creator-caption");
  await expect(preview).toContainText("Một ngày thật đẹp");
  await page.getByLabel("Emoji", { exact: true }).fill("🌻");
  await page.getByLabel("Màu chữ", { exact: true }).fill("#123456");
  await page.getByLabel("Màu bắt đầu", { exact: true }).fill("#ffffff");
  await page.getByLabel("Màu kết thúc", { exact: true }).fill("#eeeeee");
  await expect(preview).toContainText("🌻");
  await expect(preview).toHaveCSS("color", "rgb(18, 52, 86)");
  await expect(preview).toHaveCSS("background-image", /linear-gradient/);
  await expect(page.getByAltText("Xem trước khoảnh khắc")).toBeVisible();
  await expect(page.locator(".creator-file-info")).toContainText("memory.png");
  const frame = await page.locator(".creator-viewfinder").boundingBox();
  expect(Math.abs(frame.width - frame.height)).toBeLessThan(1);
  await page.screenshot({ path: info.outputPath("creator.png"), fullPage: true });
  await page.setViewportSize({ width: 320, height: 780 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Xóa tệp", exact: true }).click();
  await expect(page.getByAltText("Xem trước khoảnh khắc")).toHaveCount(0);
  await page.locator('input[type="file"]').first().setInputFiles(photo);
  await expect(page.getByAltText("Xem trước khoảnh khắc")).toBeVisible();
  await expect(page.getByLabel("Chú thích", { exact: true })).toHaveValue("Một ngày thật đẹp");
});

test("camera is explicit, captures a photo and stops tracks on close and unmount", async ({ page }) => {
  await mockCamera(page);
  await openCreator(page);
  expect(await page.evaluate(() => window.cameraCalls)).toBe(0);
  await page.getByRole("button", { name: "Mở camera", exact: true }).click();
  await expect(page.getByRole("button", { name: "Chụp ảnh", exact: true })).toBeEnabled();
  await page.getByLabel("Chú thích", { exact: true }).fill("Caption during camera");
  await page.getByRole("button", { name: "Chụp ảnh", exact: true }).click();
  await expect(page.getByAltText("Xem trước khoảnh khắc")).toBeVisible();
  await expect(page.getByLabel("Chú thích", { exact: true })).toHaveValue("Caption during camera");
  await expect.poll(() => page.evaluate(() => window.cameraTracks.every(track => track.readyState === "ended"))).toBe(true);
  await page.getByRole("button", { name: "Mở camera", exact: true }).click();
  await expect(page.getByRole("button", { name: "Chụp ảnh", exact: true })).toBeEnabled();
  await go(page, "Bạn bè");
  await expect.poll(() => page.evaluate(() => window.cameraTracks.every(track => track.readyState === "ended"))).toBe(true);
});

test("late camera permission cannot replace a newer draft after closing or leaving", async ({ page }) => {
  await mockCamera(page, true);
  await openCreator(page);
  await page.getByRole("button", { name: "Mở camera", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.cameraCalls)).toBe(1);
  await page.getByRole("button", { name: "Đóng camera", exact: true }).click();
  await page.locator('input[type="file"]').first().setInputFiles(photo);
  await page.evaluate(() => window.releaseCamera());
  await expect.poll(() => page.evaluate(() => window.cameraTracks.every(track => track.readyState === "ended"))).toBe(true);
  await expect(page.locator(".creator-file-info")).toContainText("memory.png");
  await page.getByRole("button", { name: "Mở camera", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.cameraCalls)).toBe(2);
  await go(page, "Bạn bè");
  await page.evaluate(() => window.releaseCamera());
  await expect.poll(() => page.evaluate(() => window.cameraTracks.every(track => track.readyState === "ended"))).toBe(true);
  await go(page, "Tạo khoảnh khắc");
  await expect(page.locator(".creator-file-info")).toContainText("memory.png");
});

test("recorded video exposes cover and compression, discarding a recording preserves the draft", async ({ page }) => {
  await mockCamera(page);
  await openCreator(page);
  await page.getByRole("button", { name: "Mở camera", exact: true }).click();
  await page.getByRole("button", { name: "Quay video", exact: true }).click();
  await expect(page.getByText("● ĐANG QUAY", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Dừng và dùng video", exact: true }).click();
  await expect(page.locator(".creator-file-info")).toContainText("camera-video.webm");
  await expect(page.getByLabel("Ảnh bìa video riêng (tuỳ chọn)")).toBeVisible();
  await page.getByLabel("Ảnh bìa video riêng (tuỳ chọn)").setInputFiles(photo);
  await expect(page.getByLabel("Ưu tiên nén")).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.cameraTracks.every(track => track.readyState === "ended"))).toBe(true);
  await page.getByRole("button", { name: "Mở camera", exact: true }).click();
  await page.getByRole("button", { name: "Quay video", exact: true }).click();
  await page.getByRole("button", { name: "Đóng camera", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.cameraTracks.every(track => track.readyState === "ended"))).toBe(true);
  await expect(page.getByText("memory.png", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Xóa tệp", exact: true }).click();
  await expect(page.getByLabel("Ảnh bìa video riêng (tuỳ chọn)")).toHaveCount(0);
});

test("oversized and invalid uploads retain selected media and caption", async ({ page }) => {
  await openCreator(page);
  await page.locator('input[type="file"]').first().setInputFiles(photo);
  await page.getByLabel("Chú thích", { exact: true }).fill("Keep this draft");
  await page.locator('input[type="file"]').first().setInputFiles({ name: "oversized.png", mimeType: "image/png", buffer: Buffer.alloc(32 * 1024 * 1024 + 1) });
  await expect(page.getByRole("alert")).toContainText("Tệp vượt giới hạn");
  await expect(page.locator(".creator-file-info")).toContainText("memory.png");
  await page.locator('input[type="file"]').first().setInputFiles({ name: "invalid.txt", mimeType: "text/plain", buffer: Buffer.from("invalid") });
  await expect(page.getByRole("alert")).toContainText("đúng định dạng");
  await expect(page.getByLabel("Chú thích", { exact: true })).toHaveValue("Keep this draft");
  await expect(page.getByAltText("Xem trước khoảnh khắc")).toBeVisible();
});

test("posting uses existing payload and Result without reopening a pending camera", async ({ page }) => {
  await mockCamera(page, true);
  await page.route("**/api/auth/session", route => route.fulfill({ json: { authenticated: true, generation: "creator-test", user: { uid: "creator-user", firstName: "Creator" } } }));
  await page.route("**/api/operations/**", route => route.fulfill({ json: { data: [] } }));
  let finish;
  const held = new Promise(resolve => { finish = resolve; });
  let body;
  await page.route("**/api/media/post", async route => {
    body = route.request().postDataBuffer();
    await held;
    await route.fulfill({ json: { data: { canonical_uid: "creator-post" } } });
  });
  try {
    await openCreator(page);
    await page.locator('input[type="file"]').first().setInputFiles(photo);
    await page.getByLabel("Chú thích", { exact: true }).fill("Original bytes");
    await page.getByLabel("Chỉ mình tôi", { exact: true }).uncheck();
    await page.route("**/api/operations/friends/getAllFriends", route => route.fulfill({ json: { data: [{ uid: "friend-one", first_name: "Alice" }, { uid: "friend-two", first_name: "Bob" }] } }));
    await page.getByRole("button", { name: "Chọn từ bạn bè", exact: true }).click();
    await page.getByRole("checkbox", { name: "Alice", exact: true }).check();
    await page.getByRole("checkbox", { name: "Bob", exact: true }).check();
    await page.locator(".creator-presets button").nth(1).click();
    await page.getByRole("button", { name: "Mở camera", exact: true }).click();
    await expect.poll(() => page.evaluate(() => window.cameraCalls)).toBe(1);
    await page.getByRole("button", { name: "Đăng khoảnh khắc ảnh / video", exact: true }).click();
    await expect.poll(() => Boolean(body)).toBe(true);
    expect(body.includes(photo.buffer)).toBe(true);
    expect(body.toString()).toContain('"caption":"Original bytes"');
    expect(body.toString()).toContain('"isPrivate":false');
    expect(body.toString()).toContain('"recipients":["friend-one","friend-two"]');
    finish();
    await expect(page.locator(".result")).toBeVisible();
    await page.evaluate(() => window.releaseCamera());
    await expect.poll(() => page.evaluate(() => window.cameraTracks.every(track => track.readyState === "ended"))).toBe(true);
    expect(await page.evaluate(() => window.cameraCalls)).toBe(1);
    await expect(page.getByRole("button", { name: "Mở camera", exact: true })).toBeVisible();
    await expect(page.getByLabel("Chú thích", { exact: true })).toHaveValue("Original bytes");
  } finally { finish(); }
});

test("friend names remain selected across errors and missing friends without exposing identities", async ({ page }) => {
  await page.route("**/api/auth/session", route => route.fulfill({ json: { authenticated: true, generation: "recipient-test", user: { uid: "creator-user" } } }));
  await page.route("**/api/operations/**", route => route.fulfill({ json: { data: [] } }));
  let calls = 0;
  let release;
  const held = new Promise(resolve => { release = resolve; });
  await page.route("**/api/operations/friends/getAllFriends", async route => {
    calls++;
    if (calls === 2) {
      await held;
      await route.fulfill({ status: 502, json: { error: "SDK JSON API failure for UID secret-friend" } });
    } else await route.fulfill({ json: { data: calls === 1
      ? [{ user: { uid: "alice-secret", first_name: "Alice" } }, { uid: "bob-secret", first_name: "Bob" }]
      : [{ uid: "alice-secret", first_name: "Alice" }, { uid: "unnamed-secret" }] } });
  });
  let posted;
  await page.route("**/api/media/post", route => {
    posted = JSON.parse(route.request().postDataBuffer().toString().match(/name="options"\r\n\r\n([^\r]+)/)[1]);
    return route.fulfill({ json: { data: true } });
  });
  try {
    await openCreator(page);
    const picker = page.locator(".creator-recipients");
    expect(calls).toBe(0);
    await expect(picker.locator("textarea")).toHaveCount(0);
    await page.getByRole("button", { name: "Chọn từ bạn bè", exact: true }).click();
    await page.getByRole("checkbox", { name: "Alice", exact: true }).check();
    await page.getByRole("checkbox", { name: "Bob", exact: true }).check();
    await expect(picker.getByRole("status")).toContainText("Đã chọn 2");
    await page.getByRole("button", { name: "Chọn từ bạn bè", exact: true }).click();
    await expect(page.getByRole("checkbox", { name: "Alice", exact: true })).toBeDisabled();
    release();
    await expect(picker.getByRole("alert")).toContainText("Chưa tải được bạn bè");
    await expect(page.getByRole("checkbox", { name: "Bob", exact: true })).toBeChecked();
    await page.getByRole("button", { name: "Chọn từ bạn bè", exact: true }).click();
    await expect(page.getByRole("checkbox", { name: "Bob", exact: true })).toHaveCount(0);
    await expect(picker.getByRole("checkbox", { name: "Người dùng", exact: true })).toHaveCount(0);
    await expect(picker.getByRole("status")).toContainText("Đã chọn 2");
    await page.getByRole("checkbox", { name: "Alice", exact: true }).uncheck();
    await expect(picker.getByRole("status")).toContainText("Đã chọn 1");
    await expect(picker).not.toContainText(/secret|UID|JSON|SDK|API/);
    await page.locator('input[type="file"]').first().setInputFiles(photo);
    await page.getByLabel("Chỉ mình tôi", { exact: true }).check();
    await page.getByRole("button", { name: "Đăng khoảnh khắc ảnh / video", exact: true }).click();
    await expect(page.getByRole("alert")).toContainText("Hãy bỏ chọn người nhận");
    expect(posted).toBeUndefined();
    await expect(picker.getByRole("status")).toContainText("Đã chọn 1");
    await page.getByLabel("Chỉ mình tôi", { exact: true }).uncheck();
    await page.getByRole("button", { name: "Đăng khoảnh khắc ảnh / video", exact: true }).click();
    await expect.poll(() => posted?.recipients).toEqual(["bob-secret"]);
    expect(() => validateOperation(operationMap.get("moments/post"), posted)).not.toThrow();
    await expect(page.getByRole("button", { name: "Bỏ chọn tất cả", exact: true })).toBeEnabled();
    await page.getByRole("button", { name: "Bỏ chọn tất cả", exact: true }).click();
    await expect(picker.getByRole("status")).toContainText("Chia sẻ với bạn bè");
  } finally { release(); }
});

test("late friend list is discarded on session reset", async ({ page }) => {
  await page.route("**/api/auth/session", route => route.fulfill({ json: { authenticated: true, generation: "recipient-old", user: { uid: "creator-user" } } }));
  await page.route("**/api/operations/**", route => route.fulfill({ json: { data: [] } }));
  let release;
  const held = new Promise(resolve => { release = resolve; });
  let calls = 0;
  await page.route("**/api/operations/friends/getAllFriends", async route => {
    if (++calls > 1) await held;
    await route.fulfill({ json: { data: [{ uid: "old-friend", first_name: "Old friend" }] } });
  });
  try {
    await openCreator(page);
    await page.getByRole("button", { name: "Chọn từ bạn bè", exact: true }).click();
    await page.getByRole("checkbox", { name: "Old friend", exact: true }).check();
    await page.getByRole("button", { name: "Chọn từ bạn bè", exact: true }).click();
    await expect(page.getByRole("button", { name: "Đang tải bạn bè…", exact: true })).toBeDisabled();
    await page.evaluate(() => window.dispatchEvent(new Event("lock-session-expired")));
    release();
    await expect(page.locator(".creator-recipients").getByRole("status")).toContainText("Chia sẻ với bạn bè");
    await expect(page.getByRole("button", { name: "Chọn từ bạn bè", exact: true })).toHaveCount(0);
    await expect(page.getByText("Old friend", { exact: true })).toHaveCount(0);
  } finally { release(); }
});

test("every real catalog preset produces a valid post without copying style overrides", async ({ page }) => {
  await openCreator(page);
  const selections = await page.evaluate(async () => {
    const { CaptionPresets } = await import("/src/features/moments/CaptionPreview.jsx");
    const { parseFields } = await import("/src/lib/api.js");
    const catalog = await (await fetch("/api/catalog")).json();
    const operation = catalog.operations.find(item => item.group === "moments" && item.method === "post");
    const initial = { caption: "Keep my caption", recipients: '["chosen-friend"]', icon: "🌻", colors: '["#123456"]', textColor: "#123456" };
    const selections = [];
    const tree = CaptionPresets({ presets: catalog.presets, values: initial, onChange: values => selections.push(parseFields(operation, values)), disabled: false });
    function visit(node) {
      if (!node || typeof node !== "object") return;
      if (node.type === "button") node.props.onClick();
      for (const child of [node.props?.children].flat(Infinity)) visit(child);
    }
    visit(tree);
    return { selections, count: catalog.presets.length, alphaCount: catalog.presets.filter(p => /^#[a-f0-9]{8}$/i.test(p.textColor)).length };
  });
  expect(selections.count).toBeGreaterThan(100);
  expect(selections.alphaCount).toBeGreaterThan(0);
  expect(selections.selections).toHaveLength(selections.count);
  const failures = [];
  for (const payload of selections.selections) {
    try { validateOperation(operationMap.get("moments/post"), payload); }
    catch { failures.push(payload.noteType); }
  }
  expect(failures, "Every actual preset must satisfy unchanged server validation").toEqual([]);
  for (const payload of selections.selections) {
    expect(payload).not.toHaveProperty("icon");
    expect(payload).not.toHaveProperty("colors");
    expect(payload).not.toHaveProperty("textColor");
    expect(payload.caption).toBe("Keep my caption");
    expect(payload.recipients).toEqual(["chosen-friend"]);
  }
});


test("preset alpha is previewed and both preset controls clear overrides with plain labels", async ({ page }) => {
  await openCreator(page);
  await page.locator('input[type="file"]').first().setInputFiles(photo);
  await page.getByLabel("Chú thích", { exact: true }).fill("Hello");
  await page.getByLabel("Emoji", { exact: true }).fill("🌻");
  await page.getByLabel("Màu chữ", { exact: true }).fill("#123456");
  await page.getByLabel("Mẫu chú thích", { exact: true }).selectOption("party_time");
  await expect(page.getByLabel("Emoji", { exact: true })).toHaveValue("");
  await expect(page.locator(".creator-caption")).toHaveCSS("color", /rgba\(0, 0, 0, 0\.9/);
  await expect(page.locator(".creator-caption")).toContainText("🪩 Hello");
  await expect(page.getByRole("button", { name: "Cảm nhận", exact: true })).toBeVisible();
  await expect(page.locator(".operation-form")).not.toContainText(/JSON|SDK|UID|HEX|HEVC|MIME|MiB|image\/png|moments\.post|star_sign|color_palette|custom_/);
  await expect(page.getByLabel("Màu chữ", { exact: true })).toHaveAttribute("type", "color");
});

test("video utility choices keep numeric contracts and defaults", async ({ page }) => {
  await page.route("**/api/auth/session", route => route.fulfill({ json: { authenticated: true, generation: "utility-test", user: { uid: "creator-user" } } }));
  await page.route("**/api/operations/**", route => route.fulfill({ json: { data: [] } }));
  let posted;
  await page.route("**/api/media/optimizeVideo", route => {
    posted = JSON.parse(route.request().postDataBuffer().toString().match(/name="options"\r\n\r\n([^\r]+)/)[1]);
    return route.fulfill({ contentType: "video/mp4", body: Buffer.from("fixture") });
  });
  await page.goto("/");
  await go(page, "Tiện ích");
  await page.locator(".operation-select select").selectOption("moments.optimizeVideo");
  await expect(page.getByLabel("Độ gọn video", { exact: true })).toHaveValue("5650000");
  await expect(page.getByLabel("Độ nét video", { exact: true })).toHaveValue("1080");
  await page.getByLabel("Độ gọn video", { exact: true }).selectOption({ label: "Gọn nhẹ" });
  await page.getByLabel("Độ nét video", { exact: true }).selectOption({ label: "2K" });
  await expect(page.getByLabel("Ưu tiên giữ độ nét", { exact: true })).toBeChecked();
  await page.locator('input[type="file"]').first().setInputFiles({ name: "clip.mp4", mimeType: "video/mp4", buffer: Buffer.from("fixture") });
  await page.locator('.operation-form button[type="submit"]').click();
  await expect.poll(() => posted).toEqual({ targetSizeBytes: 2000000, maxDimension: 1440, preserveResolution: true, priority: "balanced" });
  expect(() => validateOperation(operationMap.get("moments/optimizeVideo"), posted)).not.toThrow();
  await expect(page.locator(".operation-form .fields")).not.toContainText(/byte|px|HEVC|JSON/);
  await page.locator(".operation-select select").selectOption("moments.extractThumbnail");
  await expect(page.getByLabel("Chọn khung hình tại giây", { exact: true })).toHaveValue("1");
});
