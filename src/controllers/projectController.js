const projectService = require("../services/projectService");
const asyncHandler = require("../utils/asyncHandler");

const getProjects = asyncHandler(async (req, res) => {
  const projects = await projectService.getAllProjects();

  res.json({
    data: projects,
  });
});

const createProject = asyncHandler(async (req, res) => {
  const { projectName, description = "", status = "pending" } = req.body;

  if (!projectName || !projectName.trim()) {
    return res.status(400).json({
      message: "projectName is required",
    });
  }

  const project = await projectService.createProject({
    projectName: projectName.trim(),
    description,
    status,
  });

  return res.status(201).json({
    data: project,
  });
});

const updateProjectStatus = asyncHandler(async (req, res) => {
  const project = await projectService.updateProjectStatus({
    projectId: req.params.id,
    status: req.body.status,
  });

  res.json({
    data: project,
    message: "Project status updated",
  });
});

module.exports = {
  createProject,
  getProjects,
  updateProjectStatus,
};
