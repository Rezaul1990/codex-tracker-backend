const express = require("express");

const {
  createProject,
  getProjects,
} = require("../controllers/projectController");

const router = express.Router();

router.get("/", getProjects);
router.post("/", createProject);

module.exports = router;
