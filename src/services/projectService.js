const mongoose = require("mongoose");

const Project = require("../models/projectModel");
const User = require("../models/userModel");
const ApiError = require("../utils/apiError");
const { normalizeEmail } = require("../validators/authValidators");

const PROJECT_STATUSES = ["pending", "in-progress", "completed"];

const memberPopulate = [
  { path: "createdBy", select: "name email role" },
  { path: "members", select: "name email role" },
];

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const validateProjectId = (projectId) => {
  if (!isValidObjectId(projectId)) {
    throw new ApiError(400, "A valid project id is required", "VALIDATION_ERROR");
  }
};

const parseOptionalDate = (value, field) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new ApiError(400, `${field} must be a valid date`, "VALIDATION_ERROR");
  }

  return date;
};

const toObjectIdString = (value) => {
  if (!value) {
    return "";
  }

  return value._id ? value._id.toString() : value.toString();
};

const isProjectMember = (project, userId) =>
  (project.members || []).some((member) => toObjectIdString(member) === userId);

const isProjectCreator = (project, userId) => toObjectIdString(project.createdBy) === userId;

const canAccessProject = (user, project) => {
  if (user.role === "admin") {
    return true;
  }

  return isProjectCreator(project, user.id) || isProjectMember(project, user.id);
};

const canManageProject = (user, project) => {
  if (user.role === "admin") {
    return true;
  }

  return user.role === "manager" && canAccessProject(user, project);
};

const getAccessFilter = (user) => {
  if (user.role === "admin") {
    return {};
  }

  return {
    $or: [{ createdBy: user.id }, { members: user.id }],
  };
};

const ensureCanAccess = (user, project) => {
  if (!canAccessProject(user, project)) {
    throw new ApiError(403, "You are not allowed to access this project", "FORBIDDEN");
  }
};

const ensureCanManage = (user, project) => {
  if (!canManageProject(user, project)) {
    throw new ApiError(403, "You are not allowed to manage this project", "FORBIDDEN");
  }
};

const findProjectById = async (projectId) => {
  validateProjectId(projectId);

  const project = await Project.findById(projectId).populate(memberPopulate);

  if (!project) {
    throw new ApiError(404, "Project not found", "NOT_FOUND");
  }

  return project;
};

const hydrateLegacyProjectOwner = async (project, user) => {
  if (project.createdBy || !["admin", "manager"].includes(user.role)) {
    return project;
  }

  project.createdBy = user.id;

  if (!isProjectMember(project, user.id)) {
    project.members.push(user.id);
  }

  await project.save();

  return Project.findById(project._id).populate(memberPopulate);
};

const findProjectForUser = async (projectId, user) => {
  const project = await findProjectById(projectId);

  return hydrateLegacyProjectOwner(project, user);
};

const getAllProjects = ({ includeArchived = false, user }) => {
  const filter = {
    ...getAccessFilter(user),
  };

  if (!includeArchived) {
    filter.archivedAt = null;
  }

  return Project.find(filter).populate(memberPopulate).sort({ createdAt: -1 });
};

const getProjectById = async ({ projectId, user }) => {
  const project = await findProjectForUser(projectId, user);

  ensureCanAccess(user, project);

  return project;
};

const createProject = async ({
  description = "",
  dueDate,
  projectName,
  startDate,
  status = "pending",
  user,
}) => {
  if (user.role === "member") {
    throw new ApiError(403, "Members cannot create projects", "FORBIDDEN");
  }

  if (!PROJECT_STATUSES.includes(status)) {
    throw new ApiError(400, "A valid project status is required", "VALIDATION_ERROR");
  }

  const project = await Project.create({
    createdBy: user.id,
    description,
    dueDate: parseOptionalDate(dueDate, "dueDate"),
    members: [user.id],
    projectName,
    startDate: parseOptionalDate(startDate, "startDate"),
    status,
  });

  await require("./activityService").recordActivity({
    action: "project_created",
    actor: user.id,
    metadata: { projectName: project.projectName },
    project: project._id,
  });

  return Project.findById(project._id).populate(memberPopulate);
};

const updateProject = async ({ input, projectId, user }) => {
  const project = await findProjectForUser(projectId, user);

  ensureCanManage(user, project);

  if (input.projectName !== undefined) {
    if (!input.projectName || !String(input.projectName).trim()) {
      throw new ApiError(400, "projectName is required", "VALIDATION_ERROR");
    }

    project.projectName = String(input.projectName).trim();
  }

  if (input.description !== undefined) {
    project.description = String(input.description || "").trim();
  }

  if (input.status !== undefined) {
    if (!PROJECT_STATUSES.includes(input.status)) {
      throw new ApiError(400, "A valid project status is required", "VALIDATION_ERROR");
    }

    project.status = input.status;
  }

  if (input.startDate !== undefined) {
    project.startDate = parseOptionalDate(input.startDate, "startDate");
  }

  if (input.dueDate !== undefined) {
    project.dueDate = parseOptionalDate(input.dueDate, "dueDate");
  }

  await project.save();

  await require("./activityService").recordActivity({
    action: "project_updated",
    actor: user.id,
    metadata: { projectName: project.projectName },
    project: project._id,
  });

  return Project.findById(project._id).populate(memberPopulate);
};

const updateProjectStatus = async ({ projectId, status, user }) => {
  if (!PROJECT_STATUSES.includes(status)) {
    throw new ApiError(400, "A valid project status is required", "VALIDATION_ERROR");
  }

  return updateProject({
    input: { status },
    projectId,
    user,
  });
};

const resolveUser = async ({ email, userId }) => {
  if (userId) {
    if (!isValidObjectId(userId)) {
      throw new ApiError(400, "A valid user id is required", "VALIDATION_ERROR");
    }

    return User.findById(userId);
  }

  if (email) {
    return User.findOne({ email: normalizeEmail(email) });
  }

  throw new ApiError(400, "A user id or email is required", "VALIDATION_ERROR");
};

const addProjectMember = async ({ email, projectId, user, userId }) => {
  const project = await findProjectForUser(projectId, user);

  ensureCanManage(user, project);

  const targetUser = await resolveUser({ email, userId });

  if (!targetUser) {
    throw new ApiError(404, "User not found", "NOT_FOUND");
  }

  if (isProjectMember(project, targetUser._id.toString())) {
    throw new ApiError(409, "User is already a project member", "CONFLICT");
  }

  project.members.push(targetUser._id);
  await project.save();

  await require("./activityService").recordActivity({
    action: "project_member_added",
    actor: user.id,
    metadata: { memberEmail: targetUser.email, memberName: targetUser.name },
    project: project._id,
  });

  return Project.findById(project._id).populate(memberPopulate);
};

const removeProjectMember = async ({ projectId, targetUserId, user }) => {
  validateProjectId(targetUserId);

  const project = await findProjectForUser(projectId, user);

  ensureCanManage(user, project);

  if (isProjectCreator(project, targetUserId)) {
    throw new ApiError(400, "Project creator cannot be removed", "VALIDATION_ERROR");
  }

  if (!isProjectMember(project, targetUserId)) {
    throw new ApiError(404, "Project member not found", "NOT_FOUND");
  }

  project.members = project.members.filter((member) => toObjectIdString(member) !== targetUserId);
  await project.save();

  await require("./activityService").recordActivity({
    action: "project_member_removed",
    actor: user.id,
    metadata: { memberId: targetUserId },
    project: project._id,
  });

  return Project.findById(project._id).populate(memberPopulate);
};

const archiveProject = async ({ archived, projectId, user }) => {
  const project = await findProjectForUser(projectId, user);

  ensureCanManage(user, project);

  project.archivedAt = archived === false ? null : new Date();
  await project.save();

  await require("./activityService").recordActivity({
    action: project.archivedAt ? "project_archived" : "project_restored",
    actor: user.id,
    metadata: { projectName: project.projectName },
    project: project._id,
  });

  return Project.findById(project._id).populate(memberPopulate);
};

module.exports = {
  addProjectMember,
  archiveProject,
  canAccessProject,
  canManageProject,
  createProject,
  getAllProjects,
  getProjectById,
  isProjectMember,
  removeProjectMember,
  updateProject,
  updateProjectStatus,
};
