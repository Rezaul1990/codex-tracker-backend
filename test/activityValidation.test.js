const assert = require("node:assert/strict");
const test = require("node:test");

const { __test } = require("../src/services/activityService");

test("activity limit validation rejects invalid or unbounded requests", () => {
  assert.equal(__test.parseLimit(undefined), 50);
  assert.equal(__test.parseLimit("100"), 100);
  assert.throws(() => __test.parseLimit("0"), /limit must be between 1 and 100/);
  assert.throws(() => __test.parseLimit("abc"), /limit must be between 1 and 100/);
  assert.throws(() => __test.parseLimit("101"), /limit must be between 1 and 100/);
});
