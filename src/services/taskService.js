const mongoose = require("mongoose");

const { TASK_PRIORITIES, TASK_STATUSES, Task } = require("../models/taskModel");
const User = require("../models/userModel");
const ApiError = require("../utils/apiError");
const {
  canManageProject,
  getProjectById,
  isProjectMember,
} = require("./projectService");
const { recordActivity } = require("./activityService");

const taskPopulate = [
  { path: "assignee", select: "name email role" },
  { path: "createdBy", select: "name email role" },
  { path: "project", select: "projectName status archivedAt members createdBy" },
];

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const validateObjectId = (id, field) => {
  if (!isValidObjectId(id)) {
    throw new ApiError(400, `A valid ${field} is required`, "VALIDATION_ERROR");
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

const validateStatus = (status) => {
  if (!TASK_STATUSES.includes(status)) {
    throw new ApiError(400, "A valid task status is required", "VALIDATION_ERROR");
  }
};

const validatePriority = (priority) => {
  if (!TASK_PRIORITIES.includes(priority)) {
    throw new ApiError(400, "A valid task priority is required", "VALIDATION_ERROR");
  }
};

const ensureCanManageProjectTasks = (user, project) => {
  if (!canManageProject(user, project)) {
    throw new ApiError(403, "You are not allowed to manage tasks for this project", "FORBIDDEN");
  }
};

const isAssignedToUser = (task, userId) => toObjectIdString(task.assignee) === userId;

const ensureCanUpdateTaskStatus = (user, task, project) => {
  if (canManageProject(user, project) || isAssignedToUser(task, user.id)) {
    return;
  }

  throw new ApiError(403, "You are not allowed to update this task status", "FORBIDDEN");
};

const validateAssignee = async ({ assignee, project }) => {
  if (assignee === undefined || assignee === null || assignee === "") {
    return null;
  }

  validateObjectId(assignee, "assignee id");

  const targetUser = await User.findById(assignee);

  if (!targetUser) {
    throw new ApiError(404, "Assignee not found", "NOT_FOUND");
  }

  if (!isProjectMember(project, targetUser._id.toString())) {
    throw new ApiError(400, "Assignee must be a project member", "VALIDATION_ERROR");
  }

  return targetUser._id;
};

const findTaskById = async (taskId) => {
  validateObjectId(taskId, "task id");

  const task = await Task.findById(taskId).populate(taskPopulate);

  if (!task) {
    throw new ApiError(404, "Task not found", "NOT_FOUND");
  }

  return task;
};

const getProjectForTaskAccess = async ({ projectId, user }) =>
  getProjectById({
    projectId,
    user,
  });

const getTasksForProject = async ({ includeArchived = false, projectId, user }) => {
  await getProjectForTaskAccess({ projectId, user });

  const filter = {
    project: projectId,
  };

  if (!includeArchived) {
    filter.archivedAt = null;
  }

  return Task.find(filter).populate(taskPopulate).sort({ createdAt: -1 });
};

const createTask = async ({ input, projectId, user }) => {
  const project = await getProjectForTaskAccess({ projectId, user });

  ensureCanManageProjectTasks(user, project);

  if (!input.title || !String(input.title).trim()) {
    throw new ApiError(400, "title is required", "VALIDATION_ERROR");
  }

  const status = input.status || "todo";
  const priority = input.priority || "medium";

  validateStatus(status);
  validatePriority(priority);

  const assignee = await validateAssignee({
    assignee: input.assignee,
    project,
  });

  const task = await Task.create({
    assignee,
    createdBy: user.id,
    description: String(input.description || "").trim(),
    dueDate: parseOptionalDate(input.dueDate, "dueDate"),
    priority,
    project: project._id,
    startDate: parseOptionalDate(input.startDate, "startDate"),
    status,
    title: String(input.title).trim(),
  });

  await recordActivity({
    action: "task_created",
    actor: user.id,
    metadata: { taskTitle: task.title },
    project: project._id,
    task: task._id,
  });

  return Task.findById(task._id).populate(taskPopulate);
};

const getTaskById = async ({ taskId, user }) => {
  const task = await findTaskById(taskId);
  await getProjectForTaskAccess({ projectId: toObjectIdString(task.project), user });

  return task;
};

const updateTask = async ({ input, taskId, user }) => {
  const task = await findTaskById(taskId);
  const project = await getProjectForTaskAccess({ projectId: toObjectIdString(task.project), user });

  ensureCanManageProjectTasks(user, project);

  if (input.title !== undefined) {
    if (!input.title || !String(input.title).trim()) {
      throw new ApiError(400, "title is required", "VALIDATION_ERROR");
    }

    task.title = String(input.title).trim();
  }

  if (input.description !== undefined) {
    task.description = String(input.description || "").trim();
  }

  if (input.status !== undefined) {
    validateStatus(input.status);
    if (task.status !== input.status) {
      await recordActivity({
        action: "task_status_changed",
        actor: user.id,
        metadata: { from: task.status, to: input.status, taskTitle: task.title },
        project: project._id,
        task: task._id,
      });
    }
    task.status = input.status;
  }

  if (input.priority !== undefined) {
    validatePriority(input.priority);
    if (task.priority !== input.priority) {
      await recordActivity({
        action: "task_priority_changed",
        actor: user.id,
        metadata: { from: task.priority, to: input.priority, taskTitle: task.title },
        project: project._id,
        task: task._id,
      });
    }
    task.priority = input.priority;
  }

  if (input.assignee !== undefined) {
    const previousAssignee = toObjectIdString(task.assignee);
    task.assignee = await validateAssignee({
      assignee: input.assignee,
      project,
    });
    const nextAssignee = toObjectIdString(task.assignee);

    if (previousAssignee !== nextAssignee) {
      await recordActivity({
        action: previousAssignee ? "task_reassigned" : "task_assigned",
        actor: user.id,
        metadata: { assignee: nextAssignee, from: previousAssignee, taskTitle: task.title },
        project: project._id,
        task: task._id,
      });
    }
  }

  if (input.startDate !== undefined) {
    task.startDate = parseOptionalDate(input.startDate, "startDate");
  }

  if (input.dueDate !== undefined) {
    task.dueDate = parseOptionalDate(input.dueDate, "dueDate");
  }

  await task.save();

  return Task.findById(task._id).populate(taskPopulate);
};

const updateTaskStatus = async ({ status, taskId, user }) => {
  validateStatus(status);

  const task = await findTaskById(taskId);
  const project = await getProjectForTaskAccess({ projectId: toObjectIdString(task.project), user });

  ensureCanUpdateTaskStatus(user, task, project);

  if (task.status !== status) {
    await recordActivity({
      action: "task_status_changed",
      actor: user.id,
      metadata: { from: task.status, to: status, taskTitle: task.title },
      project: project._id,
      task: task._id,
    });
  }

  task.status = status;
  await task.save();

  return Task.findById(task._id).populate(taskPopulate);
};

const updateTaskAssignee = async ({ assignee, taskId, user }) => {
  return updateTask({
    input: { assignee },
    taskId,
    user,
  });
};

const archiveTask = async ({ archived, taskId, user }) => {
  const task = await findTaskById(taskId);
  const project = await getProjectForTaskAccess({ projectId: toObjectIdString(task.project), user });

  ensureCanManageProjectTasks(user, project);

  task.archivedAt = archived === false ? null : new Date();
  await task.save();

  await recordActivity({
    action: task.archivedAt ? "task_archived" : "task_restored",
    actor: user.id,
    metadata: { taskTitle: task.title },
    project: project._id,
    task: task._id,
  });

  return Task.findById(task._id).populate(taskPopulate);
};

module.exports = {
  TASK_PRIORITIES,
  TASK_STATUSES,
  archiveTask,
  createTask,
  getTaskById,
  getTasksForProject,
  updateTask,
  updateTaskAssignee,
  updateTaskStatus,
};
