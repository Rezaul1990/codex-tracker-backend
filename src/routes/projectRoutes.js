const express = require("express");

const {
  createProject,
  getProjects,
} = require("../controllers/projectController");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticate);
router.get("/", getProjects);
router.post("/", createProject);

module.exports = router;
