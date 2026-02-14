const ApiError = require("../../../error/ApiError");
const {
  ProductionTask,
  TaskSubtask,
  User,
} = require("../../../models/index");
const TaskActivityService = require("../services/TaskActivityService");

class SubtaskController {

  async getSubtasks(req, res, next) {
    try {
      const { taskId } = req.params;
      const subtasks = await TaskSubtask.findAll({
        where: { taskId },
        order: [["sortOrder", "ASC"], ["id", "ASC"]],
        include: [
          { model: User, as: "createdBy", attributes: ["id", "name", "surname"] },
        ],
      });
      return res.json(subtasks);
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }

  async createSubtask(req, res, next) {
    try {
      const { taskId } = req.params;
      const { title } = req.body;

      if (!title) return next(ApiError.badRequest("title обязателен"));

      const task = await ProductionTask.findByPk(taskId);
      if (!task) return next(ApiError.notFound("Задача не найдена"));

      const maxOrder = (await TaskSubtask.max("sortOrder", { where: { taskId } })) || 0;

      const subtask = await TaskSubtask.create({
        taskId: Number(taskId),
        title,
        sortOrder: maxOrder + 1,
        createdById: req.user.id,
      });

      const full = await TaskSubtask.findByPk(subtask.id, {
        include: [
          { model: User, as: "createdBy", attributes: ["id", "name", "surname"] },
        ],
      });

      TaskActivityService.logSubtaskAdded(Number(taskId), req.user.id, title);

      return res.json(full);
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }

  async updateSubtask(req, res, next) {
    try {
      const { id } = req.params;
      const { title, isCompleted } = req.body;

      const subtask = await TaskSubtask.findByPk(id);
      if (!subtask) return next(ApiError.notFound("Подзадача не найдена"));

      const wasCompleted = subtask.isCompleted;
      const updates = {};
      if (title !== undefined) updates.title = title;
      if (isCompleted !== undefined) updates.isCompleted = isCompleted;

      await subtask.update(updates);

      // Log when subtask gets completed
      if (isCompleted === true && !wasCompleted) {
        TaskActivityService.logSubtaskCompleted(subtask.taskId, req.user.id, subtask.title);
      }

      const full = await TaskSubtask.findByPk(id, {
        include: [
          { model: User, as: "createdBy", attributes: ["id", "name", "surname"] },
        ],
      });

      return res.json(full);
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }

  async deleteSubtask(req, res, next) {
    try {
      const { id } = req.params;
      const deleted = await TaskSubtask.destroy({ where: { id } });
      if (!deleted) return next(ApiError.notFound("Подзадача не найдена"));
      return res.json({ message: "Удалено" });
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }

  async reorderSubtasks(req, res, next) {
    try {
      const { taskId } = req.params;
      const { orderedIds } = req.body;

      if (!Array.isArray(orderedIds)) {
        return next(ApiError.badRequest("orderedIds должен быть массивом"));
      }

      for (let i = 0; i < orderedIds.length; i++) {
        await TaskSubtask.update(
          { sortOrder: i },
          { where: { id: orderedIds[i], taskId: Number(taskId) } }
        );
      }

      return res.json({ message: "OK" });
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }
}

module.exports = new SubtaskController();
