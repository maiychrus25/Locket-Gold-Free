import { test, expect } from "@playwright/test";

const go = (page, name) => page.getByRole("navigation").getByRole("button", { name, exact: true }).click();
test.afterEach(async ({ page }) => {
  await page.request.post("/api/auth/logout", { headers: { "X-Lock-Client": "web" }, data: {} });
});

test("phone navigation has readable short labels, large targets and a compact home", async ({ page }) => {
  await page.goto("/");
  for (const width of [320, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await go(page, "Tổng quan");
    const measures = await page.evaluate(() => {
      const hero = document.querySelector(".welcome-card").getBoundingClientRect();
      const dock = document.querySelector(".sidebar").getBoundingClientRect();
      return {
        heroHeight: hero.height,
        feedTop: document.querySelector(".feed-panel").getBoundingClientRect().top,
        overflow: document.documentElement.scrollWidth - innerWidth,
        dockBottom: dock.bottom,
        targets: [...document.querySelectorAll("nav .nav-item")].map(node => ({ width: node.getBoundingClientRect().width, height: node.getBoundingClientRect().height, label: node.querySelector(".nav-label-short").textContent, name: node.getAttribute("aria-label") })),
      };
    });
    expect(measures.heroHeight).toBeLessThanOrEqual(270);
    expect(measures.feedTop).toBeLessThan(760);
    expect(measures.overflow).toBeLessThanOrEqual(1);
    expect(measures.targets).toHaveLength(6);
    expect(measures.dockBottom).toBeLessThanOrEqual(844);
    for (const target of measures.targets) {
      expect(target.width).toBeGreaterThanOrEqual(44);
      expect(target.height).toBeGreaterThanOrEqual(44);
      expect(target.name).toContain(target.label);
    }
    await expect(page.getByRole("navigation").getByRole("button", { name: "Tạo khoảnh khắc", exact: true }).locator(".nav-label-short")).toHaveText("Tạo");
    await go(page, "Hồ sơ của tôi");
    await expect(page.getByRole("button", { name: "Sắc hồng", exact: true })).toBeVisible();
    await go(page, "Tiện ích");
    await expect(page.getByLabel("Bạn muốn làm gì?", { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
});

test("complete preset library expands without losing caption, privacy or selected style", async ({ page }) => {
  const login = await page.request.post("/api/auth/login", { headers: { "X-Lock-Client": "web" }, data: { email: "test@example.com", password: "test-password" } });
  expect(login.status()).toBe(200);
  await page.goto("/");
  await go(page, "Tạo khoảnh khắc");
  const catalog = await page.request.get("/api/catalog").then(response => response.json());
  await expect(page.locator(".composer-step")).toHaveCount(3);
  await page.getByLabel("Chú thích", { exact: true }).fill("Một ngày rất riêng");
  await page.getByLabel("Chỉ mình tôi", { exact: true }).check();
  await expect(page.locator(".creator-presets > .preset-button")).toHaveCount(8);
  await page.locator(".preset-library summary").click();
  await expect(page.locator(".preset-library .preset-button")).toHaveCount(catalog.presets.length - 8);
  await page.locator(".preset-library .preset-button").first().click();
  await expect(page.getByLabel("Mẫu chú thích", { exact: true })).toHaveValue(catalog.presets[8].value);
  await page.locator(".preset-library summary").click();
  await go(page, "Bạn bè");
  await go(page, "Tạo khoảnh khắc");
  await expect(page.getByLabel("Chú thích", { exact: true })).toHaveValue("Một ngày rất riêng");
  await expect(page.getByLabel("Chỉ mình tôi", { exact: true })).toBeChecked();
  await expect(page.getByLabel("Mẫu chú thích", { exact: true })).toHaveValue(catalog.presets[8].value);
  const inputs = await page.locator('input:not([type="file"]):not([type="checkbox"]), textarea, select').evaluateAll(nodes => nodes.filter(node => node.getClientRects().length).map(node => parseFloat(getComputedStyle(node).fontSize)));
  expect(Math.min(...inputs)).toBeGreaterThanOrEqual(16);
});
