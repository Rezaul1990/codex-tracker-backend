const Project = require("../models/projectModel");
const { Task } = require("../models/taskModel");
const { getAccessFilter } = require("./projectService");

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const nextWeek = () => {
  const date = startOfToday();
  date.setDate(date.getDate() + 7);
  return date;
};

const getDashboardSummary = async ({ user }) => {
  const activeProjectFilter = {
    ...getAccessFilter(user),
    archivedAt: null,
  };

  const projects = await Project.find(activeProjectFilter).select("_id status dueDate");
  const projectIds = projects.map((project) => project._id);
  const taskBaseFilter = {
    archivedAt: null,
    project: { $in: projectIds },
  };
  const today = startOfToday();
  const upcomingCutoff = nextWeek();

  const [
    totalRelevantTasks,
    todoTasks,
    inProgressTasks,
    completedTasks,
    overdueTasks,
    assignedToMeTasks,
    upcomingDueTasks,
  ] = await Promise.all([
    Task.countDocuments(taskBaseFilter),
    Task.countDocuments({ ...taskBaseFilter, status: "todo" }),
    Task.countDocuments({ ...taskBaseFilter, status: "in-progress" }),
    Task.countDocuments({ ...taskBaseFilter, status: "completed" }),
    Task.countDocuments({
      ...taskBaseFilter,
      dueDate: { $lt: today },
      status: { $ne: "completed" },
    }),
    Task.countDocuments({ ...taskBaseFilter, assignee: user.id }),
    Task.countDocuments({
      ...taskBaseFilter,
      dueDate: { $gte: today, $lte: upcomingCutoff },
      status: { $ne: "completed" },
    }),
  ]);

  return {
    activeProjects: projects.filter((project) => project.status !== "completed").length,
    assignedToMeTasks,
    completedProjects: projects.filter((project) => project.status === "completed").length,
    completedTasks,
    inProgressTasks,
    overdueTasks,
    todoTasks,
    totalAccessibleProjects: projects.length,
    totalRelevantTasks,
    upcomingDueTasks,
  };
};

module.exports = {
  getDashboardSummary,
};
