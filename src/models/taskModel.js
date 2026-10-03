const mongoose = require("mongoose");

const TASK_STATUSES = ["todo", "in-progress", "completed"];
const TASK_PRIORITIES = ["low", "medium", "high"];

const taskSchema = new mongoose.Schema(
  {
    archivedAt: {
      type: Date,
      default: null,
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    dueDate: {
      type: Date,
      default: null,
    },
    priority: {
      type: String,
      enum: TASK_PRIORITIES,
      default: "medium",
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    startDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: TASK_STATUSES,
      default: "todo",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

taskSchema.index({ archivedAt: 1 });
taskSchema.index({ assignee: 1 });
taskSchema.index({ project: 1, assignee: 1 });
taskSchema.index({ project: 1, dueDate: 1 });
taskSchema.index({ project: 1, archivedAt: 1 });
taskSchema.index({ project: 1, priority: 1 });
taskSchema.index({ project: 1, status: 1 });

module.exports = {
  TASK_PRIORITIES,
  TASK_STATUSES,
  Task: mongoose.model("Task", taskSchema),
};
