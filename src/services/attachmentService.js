const Attachment = require("../models/attachmentModel");
const ApiError = require("../utils/apiError");
const { canManageProject, getProjectById } = require("./projectService");
const { getTaskById } = require("./taskService");
const { recordActivity } = require("./activityService");
const { allowedMimeTypes, removeStoredFile } = require("./storageService");

const toObjectIdString = (value) => {
  if (!value) {
    return "";
  }

  return value._id ? value._id.toString() : value.toString();
};

const getAttachmentContext = async ({ entityId, entityType, user }) => {
  if (entityType === "project") {
    const project = await getProjectById({ projectId: entityId, user });
    return { project, projectId: toObjectIdString(project._id), task: null };
  }

  if (entityType === "task") {
    const task = await getTaskById({ taskId: entityId, user });
    return {
      project: task.project,
      projectId: toObjectIdString(task.project),
      task,
    };
  }

  throw new ApiError(400, "A valid attachment entity type is required", "VALIDATION_ERROR");
};

const validateUploadedFile = async (file) => {
  if (!file) {
    throw new ApiError(400, "Attachment file is required", "VALIDATION_ERROR");
  }

  if (!allowedMimeTypes.has(file.mimetype)) {
    await removeStoredFile(file.filename);
    throw new ApiError(400, "File type is not allowed", "VALIDATION_ERROR");
  }
};

const listAttachments = async ({ entityId, entityType, user }) => {
  await getAttachmentContext({ entityId, entityType, user });

  return Attachment.find({ entityId, entityType })
    .populate("uploadedBy", "name email role")
    .sort({ createdAt: -1 });
};

const uploadAttachment = async ({ entityId, entityType, file, user }) => {
  await validateUploadedFile(file);

  const context = await getAttachmentContext({ entityId, entityType, user });
  const attachment = await Attachment.create({
    entityId,
    entityType,
    fileName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    storageKey: file.filename,
    uploadedBy: user.id,
    url: `/uploads/${file.filename}`,
  });

  await recordActivity({
    action: "attachment_added",
    actor: user.id,
    metadata: {
      entityType,
      fileName: file.originalname,
      taskTitle: context.task?.title,
    },
    project: context.projectId,
    task: entityType === "task" ? entityId : null,
  });

  return Attachment.findById(attachment._id).populate("uploadedBy", "name email role");
};

const removeAttachment = async ({ attachmentId, user }) => {
  if (!require("mongoose").Types.ObjectId.isValid(attachmentId)) {
    throw new ApiError(400, "A valid attachment id is required", "VALIDATION_ERROR");
  }

  const attachment = await Attachment.findById(attachmentId).populate("uploadedBy", "name email role");

  if (!attachment) {
    throw new ApiError(404, "Attachment not found", "NOT_FOUND");
  }

  const context = await getAttachmentContext({
    entityId: attachment.entityId.toString(),
    entityType: attachment.entityType,
    user,
  });
  const isUploader = toObjectIdString(attachment.uploadedBy) === user.id;

  if (!isUploader && !canManageProject(user, context.project)) {
    throw new ApiError(403, "You are not allowed to remove this attachment", "FORBIDDEN");
  }

  await removeStoredFile(attachment.storageKey);
  await attachment.deleteOne();

  return attachment;
};

module.exports = {
  listAttachments,
  removeAttachment,
  uploadAttachment,
};
