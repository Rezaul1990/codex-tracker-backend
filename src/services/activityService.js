const Activity = require("../models/activityModel");
const ApiError = require("../utils/apiError");
const { getProjectById } = require("./projectService");

const recordActivity = async ({ action, actor, metadata = {}, project, task = null }) => {
  if (!actor || !project || !action) {
    return null;
  }

  return Activity.create({
    action,
    actor,
    metadata,
    project,
    task,
  });
};

const listProjectActivities = async ({ limit = 50, projectId, user }) => {
  await getProjectById({ projectId, user });

  const safeLimit = limit === undefined ? 50 : Number(limit);

  if (!Number.isInteger(safeLimit) || safeLimit < 1 || safeLimit > 100) {
    throw new ApiError(400, "limit must be between 1 and 100", "VALIDATION_ERROR");
  }

  return Activity.find({ project: projectId })
    .populate("actor", "name email role")
    .populate("task", "title status")
    .sort({ createdAt: -1 })
    .limit(safeLimit);
};

module.exports = {
  __test: {
    parseLimit: (limit) => {
      const safeLimit = limit === undefined ? 50 : Number(limit);

      if (!Number.isInteger(safeLimit) || safeLimit < 1 || safeLimit > 100) {
        throw new ApiError(400, "limit must be between 1 and 100", "VALIDATION_ERROR");
      }

      return safeLimit;
    },
  },
  listProjectActivities,
  recordActivity,
};
