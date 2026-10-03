const taskService = require("../services/taskService");
const asyncHandler = require("../utils/asyncHandler");

const getProjectTasks = asyncHandler(async (req, res) => {
  const tasks = await taskService.getTasksForProject({
    includeArchived: req.query.archived === "true",
    projectId: req.params.projectId,
    query: { ...req.query },
    user: req.user,
  });

  res.json({
    data: tasks.data,
    meta: tasks.meta,
  });
});

const createTask = asyncHandler(async (req, res) => {
  const task = await taskService.createTask({
    input: req.body,
    projectId: req.params.projectId,
    user: req.user,
  });

  res.status(201).json({
    data: task,
    message: "Task created",
  });
});

const getTask = asyncHandler(async (req, res) => {
  const task = await taskService.getTaskById({
    taskId: req.params.id,
    user: req.user,
  });

  res.json({
    data: task,
  });
});

const updateTask = asyncHandler(async (req, res) => {
  const task = await taskService.updateTask({
    input: req.body,
    taskId: req.params.id,
    user: req.user,
  });

  res.json({
    data: task,
    message: "Task updated",
  });
});

const updateTaskStatus = asyncHandler(async (req, res) => {
  const task = await taskService.updateTaskStatus({
    status: req.body.status,
    taskId: req.params.id,
    user: req.user,
  });

  res.json({
    data: task,
    message: "Task status updated",
  });
});

const updateTaskAssignee = asyncHandler(async (req, res) => {
  const task = await taskService.updateTaskAssignee({
    assignee: req.body.assignee,
    taskId: req.params.id,
    user: req.user,
  });

  res.json({
    data: task,
    message: "Task assignee updated",
  });
});

const archiveTask = asyncHandler(async (req, res) => {
  const task = await taskService.archiveTask({
    archived: req.body.archived,
    taskId: req.params.id,
    user: req.user,
  });

  res.json({
    data: task,
    message: task.archivedAt ? "Task archived" : "Task restored",
  });
});

module.exports = {
  archiveTask,
  createTask,
  getProjectTasks,
  getTask,
  updateTask,
  updateTaskAssignee,
  updateTaskStatus,
};
