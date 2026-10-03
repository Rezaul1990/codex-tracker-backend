const assert = require("node:assert/strict");
const test = require("node:test");

const { __test } = require("../src/services/taskService");

test("task pagination defaults and bounds are enforced", () => {
  assert.deepEqual(__test.parsePagination({}), {
    limit: 50,
    page: 1,
    skip: 0,
  });
  assert.deepEqual(__test.parsePagination({ limit: "25", page: "3" }), {
    limit: 25,
    page: 3,
    skip: 50,
  });

  assert.throws(() => __test.parsePagination({ limit: "101" }), /limit must be between 1 and 100/);
  assert.throws(() => __test.parsePagination({ limit: "abc" }), /limit must be between 1 and 100/);
  assert.throws(() => __test.parsePagination({ page: "0" }), /page must be a positive number/);
});

test("task sort only allows known fields and directions", () => {
  assert.deepEqual(__test.getSortOption("createdAt:desc"), { createdAt: -1 });
  assert.deepEqual(__test.getSortOption("dueDate:asc"), { dueDate: 1 });

  assert.throws(() => __test.getSortOption("assignee:asc"), /sort must use an allowed field/);
  assert.throws(() => __test.getSortOption("createdAt:sideways"), /sort must use an allowed field/);
});
