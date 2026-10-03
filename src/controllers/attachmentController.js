const attachmentService = require("../services/attachmentService");
const asyncHandler = require("../utils/asyncHandler");

const getProjectAttachments = asyncHandler(async (req, res) => {
  const attachments = await attachmentService.listAttachments({
    entityId: req.params.projectId,
    entityType: "project",
    user: req.user,
  });

  res.json({
    data: attachments,
  });
});

const uploadProjectAttachment = asyncHandler(async (req, res) => {
  const attachment = await attachmentService.uploadAttachment({
    entityId: req.params.projectId,
    entityType: "project",
    file: req.file,
    user: req.user,
  });

  res.status(201).json({
    data: attachment,
    message: "Attachment uploaded",
  });
});

const getTaskAttachments = asyncHandler(async (req, res) => {
  const attachments = await attachmentService.listAttachments({
    entityId: req.params.taskId,
    entityType: "task",
    user: req.user,
  });

  res.json({
    data: attachments,
  });
});

const uploadTaskAttachment = asyncHandler(async (req, res) => {
  const attachment = await attachmentService.uploadAttachment({
    entityId: req.params.taskId,
    entityType: "task",
    file: req.file,
    user: req.user,
  });

  res.status(201).json({
    data: attachment,
    message: "Attachment uploaded",
  });
});

const removeAttachment = asyncHandler(async (req, res) => {
  await attachmentService.removeAttachment({
    attachmentId: req.params.id,
    user: req.user,
  });

  res.json({
    message: "Attachment removed",
  });
});

module.exports = {
  getProjectAttachments,
  getTaskAttachments,
  removeAttachment,
  uploadProjectAttachment,
  uploadTaskAttachment,
};
