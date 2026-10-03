const Activity = require("../models/activityModel");
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

  const safeLimit = Math.min(Number(limit) || 50, 100);

  return Activity.find({ project: projectId })
    .populate("actor", "name email role")
    .populate("task", "title status")
    .sort({ createdAt: -1 })
    .limit(safeLimit);
};

module.exports = {
  listProjectActivities,
  recordActivity,
};
