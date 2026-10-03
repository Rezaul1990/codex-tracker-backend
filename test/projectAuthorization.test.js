const assert = require("node:assert/strict");
const test = require("node:test");

const {
  canAccessProject,
  canManageProject,
  isProjectMember,
} = require("../src/services/projectService");

const admin = { id: "admin-id", role: "admin" };
const manager = { id: "manager-id", role: "manager" };
const member = { id: "member-id", role: "member" };
const outsider = { id: "outsider-id", role: "member" };

const project = {
  createdBy: "manager-id",
  members: ["manager-id", "member-id"],
};

test("project membership accepts string ids and populated _id values", () => {
  assert.equal(isProjectMember(project, "member-id"), true);
  assert.equal(isProjectMember({ members: [{ _id: "member-id" }] }, "member-id"), true);
  assert.equal(isProjectMember(project, "outsider-id"), false);
});

test("project access is admin, creator, or member only", () => {
  assert.equal(canAccessProject(admin, project), true);
  assert.equal(canAccessProject(manager, project), true);
  assert.equal(canAccessProject(member, project), true);
  assert.equal(canAccessProject(outsider, project), false);
});

test("project management is restricted to admins and authorized managers", () => {
  assert.equal(canManageProject(admin, project), true);
  assert.equal(canManageProject(manager, project), true);
  assert.equal(canManageProject(member, project), false);
  assert.equal(canManageProject({ id: "other-manager", role: "manager" }, project), false);
});
