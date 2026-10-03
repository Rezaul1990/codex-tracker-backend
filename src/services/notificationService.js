const mongoose = require("mongoose");

const { Notification } = require("../models/notificationModel");
const ApiError = require("../utils/apiError");

const notificationPopulate = [
  { path: "actor", select: "name email role" },
  { path: "project", select: "projectName status archivedAt" },
  { path: "task", select: "title status priority archivedAt" },
];

const toObjectIdString = (value) => {
  if (!value) {
    return "";
  }

  return value._id ? value._id.toString() : value.toString();
};

const uniqueRecipients = (recipients = [], actor) => {
  const actorId = toObjectIdString(actor);

  return Array.from(
    new Set(
      recipients
        .map((recipient) => toObjectIdString(recipient))
        .filter((recipient) => recipient && recipient !== actorId),
    ),
  );
};

const createNotifications = async ({ actor = null, message, project = null, recipients, task = null, title, type }) => {
  const recipientIds = uniqueRecipients(recipients, actor);

  if (!recipientIds.length) {
    return [];
  }

  const docs = await Notification.insertMany(
    recipientIds.map((recipient) => ({
      actor,
      message,
      project,
      recipient,
      task,
      title,
      type,
    })),
  );

  return docs;
};

const listNotifications = async ({ limit = 25, unreadOnly = false, user }) => {
  const safeLimit = limit === undefined ? 25 : Number(limit);

  if (!Number.isInteger(safeLimit) || safeLimit < 1 || safeLimit > 100) {
    throw new ApiError(400, "limit must be between 1 and 100", "VALIDATION_ERROR");
  }

  const filter = { recipient: user.id };

  if (unreadOnly) {
    filter.isRead = false;
  }

  const [notifications, unreadCount] = await Promise.all([
    Notification.find(filter)
      .populate(notificationPopulate)
      .sort({ createdAt: -1 })
      .limit(safeLimit),
    Notification.countDocuments({ recipient: user.id, isRead: false }),
  ]);

  return { notifications, unreadCount };
};

const markNotificationRead = async ({ notificationId, user }) => {
  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    throw new ApiError(400, "A valid notification id is required", "VALIDATION_ERROR");
  }

  const notification = await Notification.findOne({
    _id: notificationId,
    recipient: user.id,
  });

  if (!notification) {
    throw new ApiError(404, "Notification not found", "NOT_FOUND");
  }

  if (!notification.isRead) {
    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();
  }

  return Notification.findById(notification._id).populate(notificationPopulate);
};

const markAllNotificationsRead = async ({ user }) => {
  const now = new Date();
  const result = await Notification.updateMany(
    { recipient: user.id, isRead: false },
    { $set: { isRead: true, readAt: now } },
  );

  return { modifiedCount: result.modifiedCount || 0 };
};

module.exports = {
  __test: {
    uniqueRecipients,
  },
  createNotifications,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
};
