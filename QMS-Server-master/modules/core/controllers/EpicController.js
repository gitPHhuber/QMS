const { Op } = require("sequelize");
const sequelize = require("../../../db");
const ApiError = require("../../../error/ApiError");
const {
  Epic,
  ProductionTask,
  User,
} = require("../../../models/index");

class EpicController {

  async getAll(req, res, next) {
    try {
      const epics = await Epic.findAll({
        order: [["createdAt", "DESC"]],
        include: [
          { model: User, as: "author", attributes: ["id", "name", "surname"] },
        ],
      });

      // Aggregate task stats per epic
      const epicIds = epics.map(e => e.id);
      let statsMap = {};
      if (epicIds.length > 0) {
        const stats = await sequelize.query(`
          SELECT "epicId",
                 COUNT(*)::int AS "totalTasks",
                 SUM(CASE WHEN status = 'DONE' OR status = 'CLOSED' THEN 1 ELSE 0 END)::int AS "completedTasks",
                 SUM(CASE WHEN "dueDate" < CURRENT_DATE AND status NOT IN ('DONE', 'CLOSED') THEN 1 ELSE 0 END)::int AS "overdueTasks"
          FROM production_tasks
          WHERE "epicId" = ANY($1)
          GROUP BY "epicId"
        `, { bind: [epicIds], type: sequelize.QueryTypes.SELECT });

        for (const s of stats) {
          statsMap[s.epicId] = {
            totalTasks: s.totalTasks,
            completedTasks: s.completedTasks,
            overdueTasks: s.overdueTasks,
          };
        }
      }

      const result = epics.map(e => {
        const json = e.toJSON();
        json.stats = statsMap[e.id] || { totalTasks: 0, completedTasks: 0, overdueTasks: 0 };
        return json;
      });

      return res.json(result);
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }

  async getOne(req, res, next) {
    try {
      const { id } = req.params;
      const epic = await Epic.findByPk(id, {
        include: [
          { model: User, as: "author", attributes: ["id", "name", "surname"] },
        ],
      });
      if (!epic) return next(ApiError.notFound("Эпик не найден"));

      const stats = await sequelize.query(`
        SELECT
          COUNT(*)::int AS "totalTasks",
          SUM(CASE WHEN status = 'DONE' OR status = 'CLOSED' THEN 1 ELSE 0 END)::int AS "completedTasks",
          SUM(CASE WHEN "dueDate" < CURRENT_DATE AND status NOT IN ('DONE', 'CLOSED') THEN 1 ELSE 0 END)::int AS "overdueTasks"
        FROM production_tasks
        WHERE "epicId" = $1
      `, { bind: [id], type: sequelize.QueryTypes.SELECT });

      const result = epic.toJSON();
      result.stats = stats[0] || { totalTasks: 0, completedTasks: 0, overdueTasks: 0 };

      return res.json(result);
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }

  async create(req, res, next) {
    try {
      const { title, description, color, status } = req.body;
      if (!title) return next(ApiError.badRequest("title обязателен"));

      const epic = await Epic.create({
        title,
        description: description || null,
        color: color || "#A06AE8",
        status: status || "ACTIVE",
        createdById: req.user.id,
      });

      const full = await Epic.findByPk(epic.id, {
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

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { title, description, color, status } = req.body;

      const epic = await Epic.findByPk(id);
      if (!epic) return next(ApiError.notFound("Эпик не найден"));

      const updates = {};
      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (color !== undefined) updates.color = color;
      if (status !== undefined) updates.status = status;

      await epic.update(updates);
      return res.json(epic);
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const deleted = await Epic.destroy({ where: { id } });
      if (!deleted) return next(ApiError.notFound("Эпик не найден"));
      return res.json({ message: "Удалено" });
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }
}

module.exports = new EpicController();
