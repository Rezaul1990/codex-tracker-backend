const notificationService = require("../services/notificationService");
const asyncHandler = require("../utils/asyncHandler");

const getNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.listNotifications({
    limit: req.query.limit,
    unreadOnly: req.query.unread === "true",
    user: req.user,
  });

  res.json({
    data: result.notifications,
    unreadCount: result.unreadCount,
  });
});

const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markNotificationRead({
    notificationId: req.params.id,
    user: req.user,
  });

  res.json({
    data: notification,
    message: "Notification marked as read",
  });
});

const markAllNotificationsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllNotificationsRead({
    user: req.user,
  });

  res.json({
    data: result,
    message: "Notifications marked as read",
  });
});

module.exports = {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
};
