const { Notification } = require("../models/Notification");
const ApiError = require("../../../error/ApiError");

const getAll = async (req, res, next) => {
  try {
    if (!req.user?.id) return next(ApiError.unauthorized("Требуется авторизация"));

    const { page = 1, limit = 20 } = req.query;
    const limitNum = Math.min(parseInt(limit) || 20, 50);
    const pageNum = parseInt(page) || 1;
    const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await Notification.findAndCountAll({
      where: { userId: req.user.id },
      order: [["createdAt", "DESC"]],
      limit: limitNum,
      offset,
    });

    res.json({ count, rows, page: pageNum, totalPages: Math.ceil(count / limitNum) });
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

const getCount = async (req, res, next) => {
  try {
    if (!req.user?.id) return next(ApiError.unauthorized("Требуется авторизация"));

    const count = await Notification.count({
      where: { userId: req.user.id, isRead: false },
    });

    res.json({ count });
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

const markRead = async (req, res, next) => {
  try {
    if (!req.user?.id) return next(ApiError.unauthorized("Требуется авторизация"));

    const notification = await Notification.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!notification) return next(ApiError.notFound("Уведомление не найдено"));

    await notification.update({ isRead: true, readAt: new Date() });
    res.json(notification);
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

const markAllRead = async (req, res, next) => {
  try {
    if (!req.user?.id) return next(ApiError.unauthorized("Требуется авторизация"));

    await Notification.update(
      { isRead: true, readAt: new Date() },
      { where: { userId: req.user.id, isRead: false } }
    );

    res.json({ success: true });
  } catch (e) {
    next(ApiError.internal(e.message));
  }
};

module.exports = { getAll, getCount, markRead, markAllRead };
