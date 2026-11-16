import test from "node:test";
import assert from "node:assert/strict";
import { sanitize, parseFields, records, safeUrl } from "../src/lib/api.js";

test("frontend preserves pagination cursors while removing account credentials", () => {
  assert.deepEqual(
    sanitize({
      idToken: "secret",
      nested: { refresh_token: "private", nextPageToken: "cursor" },
      invite_token: "invite",
      pageToken: "next",
    }),
    {
      nested: { nextPageToken: "cursor" },
      invite_token: "invite",
      pageToken: "next",
    },
  );
});

test("form parser preserves false and parses actual JSON and numeric inputs", () => {
  const operation = {
    fields: [
      { name: "limit", label: "Count", type: "number" },
      { name: "recipients", label: "People", type: "json" },
      { name: "isPrivate", type: "checkbox" },
      { name: "caption", type: "text" },
    ],
  };
  assert.deepEqual(
    parseFields(operation, {
      limit: "20",
      recipients: '["friend"]',
      isPrivate: false,
      caption: "",
    }),
    { limit: 20, recipients: ["friend"], isPrivate: false },
  );
  assert.throws(() => parseFields(operation, { recipients: "not-json" }));
  assert.throws(() => parseFields(operation, { limit: "invalid" }));
});

test("renders supported nested result lists and refuses executable media URLs", () => {
  assert.deepEqual(
    records({
      result: { data: { moments: [{ canonical_uid: "moment-one" }] } },
    }),
    [{ canonical_uid: "moment-one" }],
  );
  assert.equal(safeUrl("javascript:alert(1)"), undefined);
  assert.equal(safeUrl("file:///etc/passwd"), undefined);
  assert.equal(
    safeUrl("https://firebasestorage.googleapis.com/example"),
    "https://firebasestorage.googleapis.com/example",
  );
});
