const projectService = require("../services/projectService");

const getProjects = async (req, res) => {
  const projects = await projectService.getAllProjects();

  res.json({
    data: projects,
  });
};

const createProject = async (req, res) => {
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
};

module.exports = {
  createProject,
  getProjects,
};
