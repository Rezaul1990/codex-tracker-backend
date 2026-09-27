const Project = require("../models/projectModel");

const getProjects = async (req, res) => {
  const projects = await Project.find().sort({ createdAt: -1 });

  res.json({
    data: projects,
  });
};

const createProject = async (req, res) => {
  const { projectName, description = "", status = "pending" } = req.body;

  if (!projectName) {
    return res.status(400).json({
      message: "projectName is required",
    });
  }

  const project = await Project.create({
    projectName,
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
