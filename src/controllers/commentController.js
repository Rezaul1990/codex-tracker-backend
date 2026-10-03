const commentService = require("../services/commentService");
const asyncHandler = require("../utils/asyncHandler");

const getTaskComments = asyncHandler(async (req, res) => {
  const comments = await commentService.listTaskComments({
    taskId: req.params.taskId,
    user: req.user,
  });

  res.json({
    data: comments,
  });
});

const createTaskComment = asyncHandler(async (req, res) => {
  const comment = await commentService.createTaskComment({
    mentions: req.body.mentions,
    message: req.body.message,
    taskId: req.params.taskId,
    user: req.user,
  });

  res.status(201).json({
    data: comment,
    message: "Comment added",
  });
});

module.exports = {
  createTaskComment,
  getTaskComments,
};
