const Project = require("../models/projectModel");

const getAllProjects = () => Project.find().sort({ createdAt: -1 });

const createProject = ({ projectName, description = "", status = "pending" }) =>
  Project.create({
    projectName,
    description,
    status,
  });

module.exports = {
  createProject,
  getAllProjects,
};
