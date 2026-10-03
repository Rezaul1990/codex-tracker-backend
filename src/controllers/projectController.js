const projectService = require("../services/projectService");
const asyncHandler = require("../utils/asyncHandler");

const getProjects = asyncHandler(async (req, res) => {
  const projects = await projectService.getAllProjects({
    includeArchived: req.query.archived === "true",
    user: req.user,
  });

  res.json({
    data: projects,
  });
});

const getProject = asyncHandler(async (req, res) => {
  const project = await projectService.getProjectById({
    projectId: req.params.id,
    user: req.user,
  });

  res.json({
    data: project,
  });
});

const createProject = asyncHandler(async (req, res) => {
  const { description = "", dueDate, projectName, startDate, status = "pending" } = req.body;

  if (!projectName || !projectName.trim()) {
    return res.status(400).json({
      code: "VALIDATION_ERROR",
      message: "projectName is required",
    });
  }

  const project = await projectService.createProject({
    description,
    dueDate,
    projectName: projectName.trim(),
    startDate,
    status,
    user: req.user,
  });

  return res.status(201).json({
    data: project,
  });
});

const updateProject = asyncHandler(async (req, res) => {
  const project = await projectService.updateProject({
    input: req.body,
    projectId: req.params.id,
    user: req.user,
  });

  res.json({
    data: project,
    message: "Project updated",
  });
});

const updateProjectStatus = asyncHandler(async (req, res) => {
  const project = await projectService.updateProjectStatus({
    projectId: req.params.id,
    status: req.body.status,
    user: req.user,
  });

  res.json({
    data: project,
    message: "Project status updated",
  });
});

const addProjectMember = asyncHandler(async (req, res) => {
  const project = await projectService.addProjectMember({
    email: req.body.email,
    projectId: req.params.id,
    user: req.user,
    userId: req.body.userId,
  });

  res.status(201).json({
    data: project,
    message: "Project member added",
  });
});

const removeProjectMember = asyncHandler(async (req, res) => {
  const project = await projectService.removeProjectMember({
    projectId: req.params.id,
    targetUserId: req.params.userId,
    user: req.user,
  });

  res.json({
    data: project,
    message: "Project member removed",
  });
});

const archiveProject = asyncHandler(async (req, res) => {
  const project = await projectService.archiveProject({
    archived: req.body.archived,
    projectId: req.params.id,
    user: req.user,
  });

  res.json({
    data: project,
    message: project.archivedAt ? "Project archived" : "Project restored",
  });
});

module.exports = {
  addProjectMember,
  archiveProject,
  createProject,
  getProject,
  getProjects,
  removeProjectMember,
  updateProject,
  updateProjectStatus,
};
