const activityService = require("../services/activityService");
const asyncHandler = require("../utils/asyncHandler");

const getProjectActivities = asyncHandler(async (req, res) => {
  const activities = await activityService.listProjectActivities({
    limit: req.query.limit,
    projectId: req.params.projectId,
    user: req.user,
  });

  res.json({
    data: activities,
  });
});

module.exports = {
  getProjectActivities,
};
