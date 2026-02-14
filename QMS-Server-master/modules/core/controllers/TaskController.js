const { Op } = require("sequelize");
const ApiError = require("../../../error/ApiError");
const sequelize = require("../../../db");

const {
  ProductionTask,
  WarehouseBox,
  Section,
  Team,
  User,
  Project,
  TaskSubtask,
  TaskChecklist,
  TaskChecklistItem,
  Epic,
  Sprint,
} = require("../../../models/index");
const TaskActivityService = require("../services/TaskActivityService");
const BurndownSnapshotService = require("../services/BurndownSnapshotService");

class TaskController {

  async createTask(req, res, next) {
    try {
      const {
        title,
        originType,
        originId,
        targetQty,
        unit,
        dueDate,
        priority,
        comment,
        responsibleId,
        sectionId,
        projectId,
        epicId,
        sprintId,
      } = req.body;

      if (!req.user || !req.user.id) {
        return next(ApiError.unauthorized("Нет пользователя в сессии"));
      }

      if (!title || !targetQty) {
        return next(ApiError.badRequest("Нужны title и targetQty"));
      }

      const task = await ProductionTask.create({
        title,
        originType: originType || null,
        originId: originId || null,
        targetQty,
        unit: unit || "шт",
        dueDate: dueDate || null,
        priority: priority || null,
        comment: comment || null,
        status: "NEW",
        createdById: req.user.id,
        responsibleId: responsibleId || null,
        sectionId: sectionId || null,
        projectId: projectId || null,
        epicId: epicId || null,
        sprintId: sprintId || null,
      });

      TaskActivityService.logTaskCreated(task.id, req.user.id);

      return res.json(task);
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }


  async getTasks(req, res, next) {
    try {
      let { page = 1, limit = 50, status, search, originType, projectId, epicId, sprintId, backlog } = req.query;
      page = Number(page) || 1;
      limit = Number(limit) || 50;
      const offset = (page - 1) * limit;

      const where = {};
      if (status) where.status = status;
      if (originType) where.originType = originType;
      if (projectId) where.projectId = Number(projectId);
      if (epicId) where.epicId = Number(epicId);
      if (sprintId) where.sprintId = Number(sprintId);
      if (backlog === "true" && projectId) {
        where.sprintId = { [Op.is]: null };
      }
      if (search) {
        const s = String(search).trim();
        where[Op.or] = [
          { title: { [Op.iLike]: `%${s}%` } },
          { comment: { [Op.iLike]: `%${s}%` } },
        ];
      }

      const { rows, count } = await ProductionTask.findAndCountAll({
        where,
        limit,
        offset,
        order: [
          ["priority", "DESC"],
          ["dueDate", "ASC"],
          ["id", "ASC"],
        ],
        include: [
            {
                model: User,
                as: "responsible",
                attributes: ["id", "name", "surname"]
            },
            {
                model: Project,
                as: "project",
                attributes: ["id", "title"]
            },
            {
                model: User,
                as: "createdBy",
                attributes: ["id", "name", "surname"]
            },
            ...(Epic ? [{
                model: Epic,
                as: "epic",
                attributes: ["id", "title", "color"]
            }] : []),
            ...(Sprint ? [{
                model: Sprint,
                as: "sprint",
                attributes: ["id", "title", "status"]
            }] : [])
        ]
      });


      for (const task of rows) {
        let stats = {
          total: 0,
          done: 0,
          inWork: 0,
          onStock: 0
        };


        if (task.originType && task.originId) {
          const boxes = await WarehouseBox.findAll({
            attributes: ['status', 'quantity'],
            where: {
              originType: task.originType,
              originId: task.originId,
              status: { [Op.notIn]: ["SCRAP"] },
            },
          });

          for (const box of boxes) {
            const qty = Number(box.quantity) || 0;
            stats.total += qty;

            const st = box.status;
            if (st === 'DONE' || st === 'SHIPPED') {
              stats.done += qty;
            } else if (st === 'ON_STOCK') {
              stats.onStock += qty;
            } else {

              stats.inWork += qty;
            }
          }
        }

        const progressPercent = task.targetQty > 0
            ? Math.min(100, Math.round((stats.done / task.targetQty) * 100))
            : 0;


        task.setDataValue("stats", stats);
        task.setDataValue("progressPercent", progressPercent);
        task.setDataValue("totalFound", stats.total);
      }

      // Subtask & checklist progress (bulk queries)
      const taskIds = rows.map(t => t.id);
      if (taskIds.length > 0) {
        const subtaskCounts = await sequelize.query(`
          SELECT "taskId",
                 COUNT(*)::int AS "total",
                 SUM(CASE WHEN "isCompleted" THEN 1 ELSE 0 END)::int AS "completed"
          FROM task_subtasks
          WHERE "taskId" = ANY($1)
          GROUP BY "taskId"
        `, { bind: [taskIds], type: sequelize.QueryTypes.SELECT });

        const subtaskMap = {};
        for (const s of subtaskCounts) subtaskMap[s.taskId] = { total: s.total, completed: s.completed };

        const checklistCounts = await sequelize.query(`
          SELECT c."taskId",
                 COUNT(ci.id)::int AS "total",
                 SUM(CASE WHEN ci."isCompleted" THEN 1 ELSE 0 END)::int AS "completed"
          FROM task_checklists c
          JOIN task_checklist_items ci ON ci."checklistId" = c.id
          WHERE c."taskId" = ANY($1)
          GROUP BY c."taskId"
        `, { bind: [taskIds], type: sequelize.QueryTypes.SELECT });

        const checklistMap = {};
        for (const c of checklistCounts) checklistMap[c.taskId] = { total: c.total, completed: c.completed };

        const commentCounts = await sequelize.query(`
          SELECT "taskId", COUNT(*)::int AS "count"
          FROM task_comments
          WHERE "taskId" = ANY($1)
          GROUP BY "taskId"
        `, { bind: [taskIds], type: sequelize.QueryTypes.SELECT });

        const commentMap = {};
        for (const c of commentCounts) commentMap[c.taskId] = c.count;

        for (const task of rows) {
          task.setDataValue("subtaskProgress", subtaskMap[task.id] || { total: 0, completed: 0 });
          task.setDataValue("checklistProgress", checklistMap[task.id] || { total: 0, completed: 0 });
          task.setDataValue("commentCount", commentMap[task.id] || 0);
        }
      }

      return res.json({ rows, count, page, limit });
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }


  async getTaskById(req, res, next) {
    try {
      const { id } = req.params;
      const task = await ProductionTask.findByPk(id, {
        include: [
            { model: User, as: "responsible", attributes: ["id", "name", "surname"] },
            { model: Project, as: "project", attributes: ["id", "title"] },
            ...(Epic ? [{ model: Epic, as: "epic", attributes: ["id", "title", "color"] }] : []),
            ...(Sprint ? [{ model: Sprint, as: "sprint", attributes: ["id", "title", "status"] }] : [])
        ]
      });

      if (!task) {
        return next(ApiError.notFound("Задача не найдена"));
      }

      let boxes = [];
      let breakdown = [];
      let totalQty = 0;


      if (task.originType && task.originId) {
        boxes = await WarehouseBox.findAll({
          where: {
            originType: task.originType,
            originId: task.originId,
            status: { [Op.notIn]: ["SCRAP"] },
          },
          include: [
            {
              model: Section,
              as: "currentSection",
              attributes: ["id", "title"],
            },
            {
              model: Team,
              as: "currentTeam",
              attributes: ["id", "title"],
            },
          ],
          order: [["id", "ASC"]],
        });

        const map = {};

        for (const box of boxes) {
          const qty = box.quantity || 0;
          totalQty += qty;

          const key = `${box.status}|${box.currentSectionId || "null"}`;

          if (!map[key]) {
            map[key] = {
              status: box.status,
              sectionId: box.currentSectionId || null,
              sectionTitle: box.currentSection ? box.currentSection.title : null,
              qty: 0,
            };
          }
          map[key].qty += qty;
        }

        breakdown = Object.values(map);
      }

      // Subtasks & checklists
      const subtasks = await TaskSubtask.findAll({
        where: { taskId: id },
        order: [["sortOrder", "ASC"], ["id", "ASC"]],
        include: [
          { model: User, as: "createdBy", attributes: ["id", "name", "surname"] },
        ],
      });

      const checklists = await TaskChecklist.findAll({
        where: { taskId: id },
        order: [
          ["sortOrder", "ASC"],
          ["id", "ASC"],
          [{ model: TaskChecklistItem, as: "items" }, "sortOrder", "ASC"],
        ],
        include: [
          { model: TaskChecklistItem, as: "items" },
        ],
      });

      return res.json({
        task,
        totalQty,
        breakdown,
        boxes,
        subtasks,
        checklists,
      });
    } catch (e) {
      console.error(e);
      next(ApiError.internal(e.message));
    }
  }


  async updateFullTask(req, res, next) {
    try {
      const { id } = req.params;
      const {
        title, targetQty, unit, dueDate, priority, comment,
        responsibleId, sectionId, projectId, epicId, sprintId, status
      } = req.body;

      const task = await ProductionTask.findByPk(id);
      if (!task) return next(ApiError.notFound("Задача не найдена"));

      // Capture old values for activity logging
      const oldValues = {
        title: task.title,
        priority: task.priority,
        status: task.status,
        responsibleId: task.responsibleId,
        projectId: task.projectId,
        dueDate: task.dueDate,
      };

      await task.update({
        title: title !== undefined ? title : task.title,
        targetQty: targetQty !== undefined ? targetQty : task.targetQty,
        unit: unit !== undefined ? unit : task.unit,
        dueDate: dueDate !== undefined ? dueDate : task.dueDate,
        priority: priority !== undefined ? priority : task.priority,
        comment: comment !== undefined ? comment : task.comment,
        responsibleId: responsibleId !== undefined ? (responsibleId || null) : task.responsibleId,
        sectionId: sectionId !== undefined ? (sectionId || null) : task.sectionId,
        projectId: projectId !== undefined ? (projectId || null) : task.projectId,
        epicId: epicId !== undefined ? (epicId || null) : task.epicId,
        sprintId: sprintId !== undefined ? (sprintId || null) : task.sprintId,
        status: status !== undefined ? status : task.status
      });

      // Log changed fields
      const fieldsToTrack = ["title", "priority", "status", "responsibleId", "projectId", "dueDate"];
      for (const field of fieldsToTrack) {
        if (req.body[field] !== undefined && String(oldValues[field]) !== String(task[field])) {
          TaskActivityService.logFieldUpdate(task.id, req.user.id, field, oldValues[field], task[field]);
        }
      }

      return res.json(task);
    } catch (e) {
      next(ApiError.internal(e.message));
    }
  }


  async updateTaskStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const task = await ProductionTask.findByPk(id);
      if (!task) return next(ApiError.notFound("Задача не найдена"));

      const oldStatus = task.status;
      task.status = status;
      await task.save();

      TaskActivityService.logStatusChange(task.id, req.user.id, oldStatus, status);

      // Update burndown if task is in a sprint
      if (task.sprintId) {
        BurndownSnapshotService.updateForSprint(task.sprintId);
      }

      return res.json(task);
    } catch (e) {
      next(ApiError.internal(e.message));
    }
  }


  async deleteTask(req, res, next) {
    try {
        const { id } = req.params;
        const deleted = await ProductionTask.destroy({ where: { id } });
        if (!deleted) return next(ApiError.notFound("Задача не найдена"));
        return res.json({ message: "Задача удалена" });
    } catch(e) {
        next(ApiError.internal(e.message));
    }
  }
}

module.exports = new TaskController();
