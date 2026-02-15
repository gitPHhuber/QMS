const ApiError = require("../../../error/ApiError");
const {
  Sprint,
  SprintBurndown,
  ProductionTask,
  User,
  Project,
} = require("../../../models/index");
const BurndownSnapshotService = require("../services/BurndownSnapshotService");

class SprintController {

  async getSprintsForProject(req, res, next) {
    try {
      const { projectId } = req.params;
      const sprints = await Sprint.findAll({
        where: { projectId },
        order: [["createdAt", "DESC"]],
        include: [
          { model: User, as: "createdBy", attributes: ["id", "name", "surname"] },
        ],
      });

      // Get task counts per sprint
      const result = [];
      for (const sprint of sprints) {
        const tasks = await ProductionTask.count({ where: { sprintId: sprint.id } });
        const completed = await ProductionTask.count({
          where: { sprintId: sprint.id, status: { [require("sequelize").Op.in]: ["DONE", "CLOSED"] } },
        });
        const json = sprint.toJSON();
        json.taskCount = tasks;
        json.completedCount = completed;
        result.push(json);
      }

      return res.json(result);
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }

  async getSprintById(req, res, next) {
    try {
      const { id } = req.params;
      const sprint = await Sprint.findByPk(id, {
        include: [
          { model: User, as: "createdBy", attributes: ["id", "name", "surname"] },
          { model: Project, as: "project", attributes: ["id", "title"] },
        ],
      });
      if (!sprint) return next(ApiError.notFound("Спринт не найден"));

      const tasks = await ProductionTask.count({ where: { sprintId: id } });
      const completed = await ProductionTask.count({
        where: { sprintId: id, status: { [require("sequelize").Op.in]: ["DONE", "CLOSED"] } },
      });

      const result = sprint.toJSON();
      result.taskCount = tasks;
      result.completedCount = completed;

      return res.json(result);
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }

  async createSprint(req, res, next) {
    try {
      const { projectId, title, goal, startDate, endDate } = req.body;
      if (!projectId || !title) return next(ApiError.badRequest("projectId и title обязательны"));

      const sprint = await Sprint.create({
        projectId: Number(projectId),
        title,
        goal: goal || null,
        startDate: startDate || null,
        endDate: endDate || null,
        createdById: req.user.id,
      });

      return res.json(sprint);
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }

  async updateSprint(req, res, next) {
    try {
      const { id } = req.params;
      const { title, goal, startDate, endDate } = req.body;

      const sprint = await Sprint.findByPk(id);
      if (!sprint) return next(ApiError.notFound("Спринт не найден"));

      const updates = {};
      if (title !== undefined) updates.title = title;
      if (goal !== undefined) updates.goal = goal;
      if (startDate !== undefined) updates.startDate = startDate;
      if (endDate !== undefined) updates.endDate = endDate;

      await sprint.update(updates);
      return res.json(sprint);
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }

  async startSprint(req, res, next) {
    try {
      const { id } = req.params;
      const sprint = await Sprint.findByPk(id);
      if (!sprint) return next(ApiError.notFound("Спринт не найден"));
      if (sprint.status !== "PLANNING") return next(ApiError.badRequest("Спринт уже запущен"));

      await sprint.update({ status: "ACTIVE" });

      // Create ideal burndown line
      BurndownSnapshotService.createIdealBurndown(sprint.id);
      // Snapshot current state
      BurndownSnapshotService.updateForSprint(sprint.id);

      return res.json(sprint);
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }

  async completeSprint(req, res, next) {
    try {
      const { id } = req.params;
      const sprint = await Sprint.findByPk(id);
      if (!sprint) return next(ApiError.notFound("Спринт не найден"));
      if (sprint.status !== "ACTIVE") return next(ApiError.badRequest("Спринт не активен"));

      await sprint.update({ status: "COMPLETED" });

      // Final snapshot
      BurndownSnapshotService.updateForSprint(sprint.id);

      return res.json(sprint);
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }

  async getBurndown(req, res, next) {
    try {
      const { id } = req.params;
      const points = await SprintBurndown.findAll({
        where: { sprintId: id },
        order: [["date", "ASC"]],
      });
      return res.json(points);
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }
}

module.exports = new SprintController();
