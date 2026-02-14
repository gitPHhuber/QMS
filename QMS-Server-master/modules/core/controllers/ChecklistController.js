const ApiError = require("../../../error/ApiError");
const {
  ProductionTask,
  TaskChecklist,
  TaskChecklistItem,
  User,
} = require("../../../models/index");
const TaskActivityService = require("../services/TaskActivityService");

class ChecklistController {

  async getChecklists(req, res, next) {
    try {
      const { taskId } = req.params;
      const checklists = await TaskChecklist.findAll({
        where: { taskId },
        order: [
          ["sortOrder", "ASC"],
          ["id", "ASC"],
          [{ model: TaskChecklistItem, as: "items" }, "sortOrder", "ASC"],
        ],
        include: [
          {
            model: TaskChecklistItem,
            as: "items",
          },
        ],
      });
      return res.json(checklists);
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }

  async createChecklist(req, res, next) {
    try {
      const { taskId } = req.params;
      const { title } = req.body;

      const task = await ProductionTask.findByPk(taskId);
      if (!task) return next(ApiError.notFound("Задача не найдена"));

      const maxOrder = (await TaskChecklist.max("sortOrder", { where: { taskId } })) || 0;

      const checklist = await TaskChecklist.create({
        taskId: Number(taskId),
        title: title || "Чеклист",
        sortOrder: maxOrder + 1,
        createdById: req.user.id,
      });

      const full = await TaskChecklist.findByPk(checklist.id, {
        include: [{ model: TaskChecklistItem, as: "items" }],
      });

      return res.json(full);
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }

  async updateChecklist(req, res, next) {
    try {
      const { checklistId } = req.params;
      const { title } = req.body;

      const checklist = await TaskChecklist.findByPk(checklistId);
      if (!checklist) return next(ApiError.notFound("Чеклист не найден"));

      if (title !== undefined) await checklist.update({ title });

      return res.json(checklist);
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }

  async deleteChecklist(req, res, next) {
    try {
      const { checklistId } = req.params;
      const deleted = await TaskChecklist.destroy({ where: { id: checklistId } });
      if (!deleted) return next(ApiError.notFound("Чеклист не найден"));
      return res.json({ message: "Удалено" });
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }

  async createItem(req, res, next) {
    try {
      const { checklistId } = req.params;
      const { title } = req.body;

      if (!title) return next(ApiError.badRequest("title обязателен"));

      const checklist = await TaskChecklist.findByPk(checklistId);
      if (!checklist) return next(ApiError.notFound("Чеклист не найден"));

      const maxOrder = (await TaskChecklistItem.max("sortOrder", { where: { checklistId } })) || 0;

      const item = await TaskChecklistItem.create({
        checklistId: Number(checklistId),
        title,
        sortOrder: maxOrder + 1,
      });

      return res.json(item);
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }

  async updateItem(req, res, next) {
    try {
      const { itemId } = req.params;
      const { title, isCompleted } = req.body;

      const item = await TaskChecklistItem.findByPk(itemId);
      if (!item) return next(ApiError.notFound("Пункт не найден"));

      const wasCompleted = item.isCompleted;
      const updates = {};
      if (title !== undefined) updates.title = title;
      if (isCompleted !== undefined) updates.isCompleted = isCompleted;

      await item.update(updates);

      // Log when checklist item gets completed
      if (isCompleted === true && !wasCompleted) {
        const checklist = await TaskChecklist.findByPk(item.checklistId, { attributes: ["taskId"] });
        if (checklist) {
          TaskActivityService.logChecklistItemCompleted(checklist.taskId, req.user.id, item.title);
        }
      }

      return res.json(item);
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }

  async deleteItem(req, res, next) {
    try {
      const { itemId } = req.params;
      const deleted = await TaskChecklistItem.destroy({ where: { id: itemId } });
      if (!deleted) return next(ApiError.notFound("Пункт не найден"));
      return res.json({ message: "Удалено" });
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }
}

module.exports = new ChecklistController();
