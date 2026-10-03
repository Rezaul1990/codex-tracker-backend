const Comment = require("../models/commentModel");
const User = require("../models/userModel");
const ApiError = require("../utils/apiError");
const { isProjectMember } = require("./projectService");
const { getTaskById } = require("./taskService");
const { recordActivity } = require("./activityService");
const { createNotifications } = require("./notificationService");

const toObjectIdString = (value) => {
  if (!value) {
    return "";
  }

  return value._id ? value._id.toString() : value.toString();
};

const getProjectIdFromTask = (task) => toObjectIdString(task.project);

const resolveMentions = async ({ mentions = [], task }) => {
  const uniqueMentionIds = Array.from(new Set(Array.isArray(mentions) ? mentions : []));

  if (uniqueMentionIds.length === 0) {
    return [];
  }

  const users = await User.find({ _id: { $in: uniqueMentionIds } });

  if (users.length !== uniqueMentionIds.length) {
    throw new ApiError(400, "One or more mentioned users were not found", "VALIDATION_ERROR");
  }

  const invalidMention = users.find((mentionedUser) => !isProjectMember(task.project, mentionedUser._id.toString()));

  if (invalidMention) {
    throw new ApiError(400, "Mentioned users must be project members", "VALIDATION_ERROR");
  }

  return users.map((mentionedUser) => mentionedUser._id);
};

const listTaskComments = async ({ taskId, user }) => {
  await getTaskById({ taskId, user });

  return Comment.find({ task: taskId })
    .populate("author", "name email role")
    .populate("mentions", "name email role")
    .sort({ createdAt: 1 });
};

const createTaskComment = async ({ mentions = [], message, taskId, user }) => {
  const cleanMessage = String(message || "").trim();

  if (!cleanMessage) {
    throw new ApiError(400, "Comment message is required", "VALIDATION_ERROR");
  }

  const task = await getTaskById({ taskId, user });
  const mentionIds = await resolveMentions({ mentions, task });

  const comment = await Comment.create({
    author: user.id,
    message: cleanMessage,
    mentions: mentionIds,
    task: taskId,
  });

  await recordActivity({
    action: "comment_added",
    actor: user.id,
    metadata: { taskTitle: task.title },
    project: getProjectIdFromTask(task),
    task: taskId,
  });

  await createNotifications({
    actor: user.id,
    message: `${user.name} commented on "${task.title}".`,
    project: getProjectIdFromTask(task),
    recipients: [...mentionIds, task.assignee],
    task: taskId,
    title: "New task comment",
    type: "comment_added",
  });

  return Comment.findById(comment._id)
    .populate("author", "name email role")
    .populate("mentions", "name email role");
};

module.exports = {
  createTaskComment,
  listTaskComments,
};
