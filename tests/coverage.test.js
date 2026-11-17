import test from "node:test";
import assert from "node:assert/strict";
import sdk from "locket.js";
import {
  operations,
  operationMap,
  validateOperation,
} from "../shared/operations.js";

test("every account-facing SDK method has an allowlisted web flow", () => {
  const internals = new Set([
    "constructor",
    "recordPostedMoment",
    "recordMessage",
    "encodeQueryCursor",
    "decodeQueryCursor",
    "getDocDateValue",
    "parseFirestoreValue",
  ]);
  for (const [group, Type] of [
    ["user", sdk.UserModule],
    ["moments", sdk.MomentsModule],
    ["friends", sdk.FriendsModule],
    ["chat", sdk.ChatModule],
  ]) {
    for (const method of Object.getOwnPropertyNames(Type.prototype)) {
      if (method.startsWith("_") || internals.has(method)) continue;
      assert.ok(
        operationMap.has(`${group}/${method}`),
        `Missing web flow: ${group}/${method}`,
      );
    }
  }
  assert.equal(
    new Set(operations.map((op) => `${op.group}/${op.method}`)).size,
    operations.length,
  );
});

test("optional pagination remains optional, recipients do not accidentally target nobody", () => {
  const latest = operationMap.get("moments/getLatest");
  assert.deepEqual(validateOperation(latest, {}), {});
  assert.deepEqual(validateOperation(latest, { pageToken: "moment-one" }), { pageToken: "moment-one" });
  assert.throws(() => validateOperation(latest, { pageToken: "https://attacker.example" }));
  assert.throws(() => validateOperation(latest, { pageToken: "x".repeat(151) }));
  assert.deepEqual(
    validateOperation(operationMap.get("moments/getMoments"), {}),
    { limit: 20 },
  );
  const post = validateOperation(operationMap.get("moments/post"), {
    recipients: [],
  });
  assert.equal(post.recipients, undefined);
  assert.equal(post.autoCompress, true);
});

test("rejects empty messages, invalid dates and contradictory privacy before SDK calls", () => {
  assert.throws(() =>
    validateOperation(operationMap.get("chat/sendMessage"), {
      receiverUid: "friend",
    }),
  );
  assert.throws(() =>
    validateOperation(operationMap.get("moments/getAllMyMoments"), {
      startDate: "2026-12-01",
      endDate: "2026-01-01",
    }),
  );
  assert.throws(() =>
    validateOperation(operationMap.get("moments/post"), {
      isPrivate: true,
      recipients: ["friend"],
    }),
  );
  assert.throws(() =>
    validateOperation(operationMap.get("user/updateBirthdate"), {
      birthdate: "2100-01-01",
    }),
  );
});
