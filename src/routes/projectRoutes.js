const express = require("express");

const {
  createProject,
  getProjects,
  updateProjectStatus,
} = require("../controllers/projectController");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticate);
router.get("/", getProjects);
router.post("/", createProject);
router.patch("/:id/status", updateProjectStatus);

module.exports = router;
