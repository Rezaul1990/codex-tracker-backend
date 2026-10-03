const express = require("express");

const {
  archiveTask,
  getTask,
  updateTask,
  updateTaskAssignee,
  updateTaskStatus,
} = require("../controllers/taskController");
const {
  createTaskComment,
  getTaskComments,
} = require("../controllers/commentController");
const {
  getTaskAttachments,
  uploadTaskAttachment,
} = require("../controllers/attachmentController");
const { authenticate } = require("../middleware/authMiddleware");
const { upload } = require("../services/storageService");

const router = express.Router();

router.use(authenticate);
router.get("/:taskId/comments", getTaskComments);
router.post("/:taskId/comments", createTaskComment);
router.get("/:taskId/attachments", getTaskAttachments);
router.post("/:taskId/attachments", upload.single("file"), uploadTaskAttachment);
router.get("/:id", getTask);
router.patch("/:id", updateTask);
router.patch("/:id/status", updateTaskStatus);
router.patch("/:id/assignee", updateTaskAssignee);
router.patch("/:id/archive", archiveTask);

module.exports = router;
