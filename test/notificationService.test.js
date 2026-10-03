const assert = require("node:assert/strict");
const test = require("node:test");

const { __test } = require("../src/services/notificationService");

test("notification recipients are unique and never include actor", () => {
  assert.deepEqual(
    __test.uniqueRecipients(
      ["user-1", { _id: "user-1" }, { _id: "user-2" }, "actor-id", null],
      "actor-id",
    ),
    ["user-1", "user-2"],
  );
});
