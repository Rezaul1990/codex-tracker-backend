const Project = require("../models/projectModel");
const mongoose = require("mongoose");
const ApiError = require("../utils/apiError");

const PROJECT_STATUSES = ["pending", "in-progress", "completed"];

const getAllProjects = () => Project.find().sort({ createdAt: -1 });

const createProject = ({ projectName, description = "", status = "pending" }) => {
  if (!PROJECT_STATUSES.includes(status)) {
    throw new ApiError(400, "A valid project status is required", "VALIDATION_ERROR");
  }

  return Project.create({
    projectName,
    description,
    status,
  });
};

const updateProjectStatus = async ({ projectId, status }) => {
  if (!PROJECT_STATUSES.includes(status)) {
    throw new ApiError(400, "A valid project status is required", "VALIDATION_ERROR");
  }

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new ApiError(400, "A valid project id is required", "VALIDATION_ERROR");
  }

  const project = await Project.findByIdAndUpdate(
    projectId,
    { status },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!project) {
    throw new ApiError(404, "Project not found", "NOT_FOUND");
  }

  return project;
};

module.exports = {
  createProject,
  getAllProjects,
  updateProjectStatus,
};
