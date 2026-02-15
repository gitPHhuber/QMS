const ApiError = require("../../../error/ApiError");
const {
  ProductionTask,
  TaskComment,
  User,
  Notification,
} = require("../../../models/index");
const TaskActivityService = require("../services/TaskActivityService");

class CommentController {

  async getComments(req, res, next) {
    try {
      const { taskId } = req.params;
      const comments = await TaskComment.findAll({
        where: { taskId },
        order: [["createdAt", "ASC"]],
        include: [
          { model: User, as: "author", attributes: ["id", "name", "surname"] },
        ],
      });
      return res.json(comments);
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }

  async createComment(req, res, next) {
    try {
      const { taskId } = req.params;
      const { body, parentId, mentions } = req.body;

      if (!body || !body.trim()) return next(ApiError.badRequest("body обязателен"));

      const task = await ProductionTask.findByPk(taskId);
      if (!task) return next(ApiError.notFound("Задача не найдена"));

      const mentionIds = Array.isArray(mentions) ? mentions.map(Number).filter(Boolean) : [];

      const comment = await TaskComment.create({
        taskId: Number(taskId),
        parentId: parentId || null,
        authorId: req.user.id,
        body: body.trim(),
        mentions: mentionIds,
      });

      // Create notifications for mentioned users
      if (mentionIds.length > 0 && Notification) {
        const notifPromises = mentionIds
          .filter(uid => uid !== req.user.id) // don't notify self
          .map(uid =>
            Notification.create({
              userId: uid,
              type: "TASK_MENTION",
              title: "Вас упомянули в комментарии",
              message: `${req.user.surname} ${req.user.name} упомянул(а) вас в задаче #${taskId}`,
              severity: "INFO",
              entityType: "production_task",
              entityId: Number(taskId),
              link: `/tasks?taskId=${taskId}`,
            }).catch(e => console.error("[CommentController] notification error:", e.message))
          );
        await Promise.all(notifPromises);
      }

      // Log activity
      TaskActivityService.logCommentAdded(Number(taskId), req.user.id);

      const full = await TaskComment.findByPk(comment.id, {
        include: [
          { model: User, as: "author", attributes: ["id", "name", "surname"] },
        ],
      });

      return res.json(full);
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }

  async updateComment(req, res, next) {
    try {
      const { commentId } = req.params;
      const { body } = req.body;

      const comment = await TaskComment.findByPk(commentId);
      if (!comment) return next(ApiError.notFound("Комментарий не найден"));

      // Only author can edit
      if (comment.authorId !== req.user.id) {
        return next(ApiError.forbidden("Только автор может редактировать"));
      }

      if (body !== undefined) await comment.update({ body: body.trim() });

      const full = await TaskComment.findByPk(commentId, {
        include: [
          { model: User, as: "author", attributes: ["id", "name", "surname"] },
        ],
      });

      return res.json(full);
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }

  async deleteComment(req, res, next) {
    try {
      const { commentId } = req.params;

      const comment = await TaskComment.findByPk(commentId);
      if (!comment) return next(ApiError.notFound("Комментарий не найден"));

      // Only author or admin
      if (comment.authorId !== req.user.id) {
        // Check if user is admin via role
        const user = await User.findByPk(req.user.id, { attributes: ["roleId"] });
        if (!user || user.roleId !== 1) {
          return next(ApiError.forbidden("Нет прав на удаление"));
        }
      }

      await comment.destroy();
      return res.json({ message: "Удалено" });
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }
}

module.exports = new CommentController();
