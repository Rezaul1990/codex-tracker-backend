const dashboardService = require("../services/dashboardService");
const asyncHandler = require("../utils/asyncHandler");

const getDashboardSummary = asyncHandler(async (req, res) => {
  const summary = await dashboardService.getDashboardSummary({
    user: req.user,
  });

  res.json({
    data: summary,
  });
});

module.exports = {
  getDashboardSummary,
};
