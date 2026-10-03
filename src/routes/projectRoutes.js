const express = require("express");

const {
  addProjectMember,
  archiveProject,
  createProject,
  getProject,
  getProjects,
  removeProjectMember,
  updateProject,
  updateProjectStatus,
} = require("../controllers/projectController");
const {
  getProjectAttachments,
  uploadProjectAttachment,
} = require("../controllers/attachmentController");
const { getProjectActivities } = require("../controllers/activityController");
const { createTask, getProjectTasks } = require("../controllers/taskController");
const { authenticate } = require("../middleware/authMiddleware");
const { upload } = require("../services/storageService");

const router = express.Router();

router.use(authenticate);
router.get("/", getProjects);
router.post("/", createProject);
router.get("/:projectId/tasks", getProjectTasks);
router.post("/:projectId/tasks", createTask);
router.get("/:projectId/attachments", getProjectAttachments);
router.post("/:projectId/attachments", upload.single("file"), uploadProjectAttachment);
router.get("/:projectId/activities", getProjectActivities);
router.get("/:id", getProject);
router.patch("/:id", updateProject);
router.patch("/:id/status", updateProjectStatus);
router.post("/:id/members", addProjectMember);
router.delete("/:id/members/:userId", removeProjectMember);
router.patch("/:id/archive", archiveProject);

module.exports = router;
