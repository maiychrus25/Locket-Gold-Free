import { test, expect } from "@playwright/test";

const go = (page, name) =>
  page
    .getByRole("navigation")
    .getByRole("button", { name, exact: true })
    .click();
async function signedIn(page) {
  const response = await page.request.post("/api/auth/login", {
    headers: { "X-Lock-Client": "web" },
    data: { email: "test@example.com", password: "test-password" },
  });
  expect(response.status()).toBe(200);
  const session = await response.json();
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Hồ sơ", exact: true }),
  ).toBeVisible();
  return session;
}

test.afterEach(async ({ page }) => {
  await page.request.post("/api/auth/logout", {
    headers: { "X-Lock-Client": "web" },
    data: {},
  });
});

test("pending chat history locks its recipient and conversation until completion", async ({
  page,
}) => {
  await page.route("**/api/operations/friends/getAllFriends", route => route.fulfill({
    json: { data: [
      { uid: "alice", displayName: "Alice", username: "alice" },
      { uid: "bob", displayName: "Bob", username: "bob" },
    ] },
  }));
  await page.route("**/api/operations/chat/getConversations", (route) =>
    route.fulfill({
      json: {
        data: [
          { conversation_id: "alice-conversation", peer_uid: "alice", other_user: { uid: "alice", first_name: "Alice" } },
          { conversation_id: "bob-conversation", peer_uid: "bob", other_user: { uid: "bob", first_name: "Bob" } },
        ],
      },
    }),
  );
  let release;
  const held = new Promise((resolve) => {
    release = resolve;
  });
  await page.route("**/api/operations/chat/getMessages", async (route) => {
    await held;
    await route.fulfill({
      json: {
        data: [
          {
            conversation_id: "alice-conversation",
            message_id: "alice-message",
            text: "Alice history",
          },
        ],
      },
    });
  });
  await signedIn(page);
  await go(page, "Tin nhắn");
  const recipient = page.getByLabel("Người nhận tin nhắn", { exact: true });
  try {
    const history = page.waitForRequest(request => request.url().endsWith("/api/operations/chat/getMessages"));
    await page.getByRole("button", { name: /Alice.*Mở trò chuyện/ }).click();
    expect((await history).postDataJSON()).toEqual({ otherUserId: "alice", conversationId: "alice-conversation", fetchServer: true });
    await expect(recipient).toHaveValue("alice");
    await expect(recipient).toBeDisabled();
    await expect(
      page.getByRole("button", { name: /Bob.*Mở trò chuyện/ }),
    ).toBeDisabled();
    release();
    await expect(page.locator(".message")).toContainText("Alice history");
    await expect(recipient).toBeEnabled();
    await page.locator(".chat-layout").getByRole("button", { name: "Chọn từ bạn bè", exact: true }).click();
    await recipient.selectOption({ label: "Bob" });
    await expect(page.locator(".message")).toHaveCount(0);
  } finally {
    release();
  }
});

test("friend lookup actions use the returned UID and disappear when the search changes", async ({
  page,
}) => {
  let release;
  const held = new Promise((resolve) => {
    release = resolve;
  });
  await page.route(
    "**/api/operations/user/getProfileByUsername",
    async (route) => {
      await held;
      await route.fulfill({
        json: { data: { uid: "alice-uid", first_name: "Alice" } },
      });
    },
  );
  await page.route("**/api/operations/friends/sendRequest", (route) =>
    route.fulfill({ json: { data: true } }),
  );
  await signedIn(page);
  await go(page, "Bạn bè");
  const search = page.getByLabel("Tìm bạn bằng username");
  try {
    await search.fill("alice");
    await page.getByRole("button", { name: "Tìm bạn", exact: true }).click();
    await expect(search).toBeDisabled();
    release();
    const card = page
      .locator(".person-card")
      .filter({
        has: page.getByRole("heading", { name: "Alice", exact: true }),
      });
    await expect(card).toBeVisible();
    const sent = page.waitForRequest((request) =>
      request.url().endsWith("/api/operations/friends/sendRequest"),
    );
    await card
      .getByRole("button", { name: "Gửi lời mời", exact: true })
      .click();
    expect((await sent).postDataJSON()).toEqual({ userUid: "alice-uid" });
    await expect(search).toBeEnabled();
    await search.fill("bob");
    await expect(card).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Gửi lời mời", exact: true }),
    ).toHaveCount(0);
  } finally {
    release();
  }
});

test("history defaults to the current user and invalidates cursors on filter edits", async ({
  page,
}) => {
  const inputs = [];
  await page.route("**/api/operations/friends/getAllFriends", route => route.fulfill({
    json: { data: [{ uid: "another-user", displayName: "Linh", username: "linh" }] },
  }));
  await page.route("**/api/operations/moments/getMoments", (route) => {
    inputs.push(route.request().postDataJSON());
    return route.fulfill({
      json: {
        data: { moments: [], nextPageToken: "cursor-for-current-filter" },
      },
    });
  });
  const session = await signedIn(page);
  await page.getByRole("tab", { name: "Lịch sử của tôi", exact: true }).click();
  const next = page.getByRole("button", {
    name: "Trang tiếp theo",
    exact: true,
  });
  await expect(next).toBeVisible();
  expect(inputs[0]).toEqual({ limit: 20, filteredByUserId: session.user.uid });
  await page.locator(".feed-panel").getByRole("button", { name: "Chọn từ bạn bè", exact: true }).click();
  await page.getByLabel("Khoảnh khắc của", { exact: true }).selectOption({ label: "Linh" });
  await expect(next).toHaveCount(0);
  const filtered = page.waitForRequest((request) =>
    request.url().endsWith("/api/operations/moments/getMoments"),
  );
  await page.getByRole("button", { name: "Lọc", exact: true }).click();
  expect((await filtered).postDataJSON()).toEqual({
    limit: 20,
    filteredByUserId: "another-user",
  });
});

test("history hides actions for unknown authors and deletes only the current user's posts", async ({
  page,
}) => {
  const session = await signedIn(page);
  await page.route("**/api/operations/moments/getMoments", (route) =>
    route.fulfill({
      json: {
        data: {
          moments: [
            {
              moment_uid: "unknown",
              caption: "Unknown author",
              user_uid: session.user.uid,
            },
            {
              moment_uid: "other",
              caption: "Other author",
              user: "someone-else",
            },
            {
              moment_uid: "own",
              caption: "Own author",
              user_uid: session.user.uid,
              authorVerified: true,
            },
          ],
        },
      },
    }),
  );
  await page.getByRole("tab", { name: "Lịch sử của tôi", exact: true }).click();
  const card = (caption) =>
    page
      .locator(".moment-card")
      .filter({ has: page.getByText(caption, { exact: true }) });
  await expect(card("Unknown author")).toBeVisible();
  await expect(
    card("Unknown author").getByLabel("Bình luận khoảnh khắc"),
  ).toHaveCount(0);
  await expect(
    card("Unknown author").getByRole("button", { name: "Xoá", exact: true }),
  ).toHaveCount(0);
  await expect(
    card("Other author").getByLabel("Bình luận khoảnh khắc"),
  ).toBeVisible();
  await expect(
    card("Other author").getByRole("button", { name: "Xoá", exact: true }),
  ).toHaveCount(0);
  await expect(
    card("Own author").getByRole("button", { name: "Xoá", exact: true }),
  ).toBeVisible();
});
