const { Op } = require("sequelize");
const { Project, User, ProductionTask } = require("../../../models/index");
const ApiError = require("../../../error/ApiError");

class ProjectController {
  async create(req, res, next) {
    try {
      const { title, description } = req.body;
      if (!title) return next(ApiError.badRequest("Нужно название проекта"));

      const project = await Project.create({
        title,
        description,
        createdById: req.user.id
      });
      return res.json(project);
    } catch (e) {
      next(ApiError.internal(e.message));
    }
  }

  async getAll(req, res, next) {
    try {
      const projects = await Project.findAll({
        order: [["createdAt", "DESC"]],
        include: [{ model: User, as: "author", attributes: ["name", "surname"] }]
      });

      const result = [];

      for (const project of projects) {
        const tasks = await ProductionTask.findAll({
          where: { projectId: project.id },
          attributes: ["id", "status", "dueDate", "responsibleId"],
          include: [
            { model: User, as: "responsible", attributes: ["id", "name", "surname"] }
          ]
        });

        const total = tasks.length;
        const byStatus = { NEW: 0, IN_PROGRESS: 0, REVIEW: 0, DONE: 0, CLOSED: 0 };
        for (const t of tasks) {
          if (byStatus[t.status] !== undefined) byStatus[t.status]++;
        }
        const now = new Date();
        const overdue = tasks.filter(
          t => t.dueDate && new Date(t.dueDate) < now && t.status !== "DONE" && t.status !== "CLOSED"
        ).length;
        const doneAndClosed = byStatus.DONE + byStatus.CLOSED;
        const progressPercent = total > 0 ? Math.round((doneAndClosed / total) * 100) : 0;

        // Collect unique members from responsible
        const membersMap = {};
        for (const t of tasks) {
          if (t.responsible && !membersMap[t.responsible.id]) {
            membersMap[t.responsible.id] = {
              id: t.responsible.id,
              name: t.responsible.name,
              surname: t.responsible.surname
            };
          }
        }
        const members = Object.values(membersMap);

        const plain = project.toJSON();
        plain.taskStats = { total, byStatus, overdue, progressPercent };
        plain.members = members;
        result.push(plain);
      }

      return res.json(result);
    } catch (e) {
      next(ApiError.internal(e.message));
    }
  }

  async getOne(req, res, next) {
    try {
      const { id } = req.params;
      const project = await Project.findByPk(id, {
        include: [{ model: User, as: "author", attributes: ["name", "surname"] }]
      });

      if (!project) return next(ApiError.notFound("Проект не найден"));

      const tasks = await ProductionTask.findAll({
        where: { projectId: id },
        attributes: ["id", "status", "dueDate", "responsibleId"],
        include: [
          { model: User, as: "responsible", attributes: ["id", "name", "surname"] }
        ]
      });

      const total = tasks.length;
      const byStatus = { NEW: 0, IN_PROGRESS: 0, REVIEW: 0, DONE: 0, CLOSED: 0 };
      for (const t of tasks) {
        if (byStatus[t.status] !== undefined) byStatus[t.status]++;
      }
      const now = new Date();
      const overdue = tasks.filter(
        t => t.dueDate && new Date(t.dueDate) < now && t.status !== "DONE" && t.status !== "CLOSED"
      ).length;
      const doneAndClosed = byStatus.DONE + byStatus.CLOSED;
      const progressPercent = total > 0 ? Math.round((doneAndClosed / total) * 100) : 0;

      const membersMap = {};
      for (const t of tasks) {
        if (t.responsible && !membersMap[t.responsible.id]) {
          membersMap[t.responsible.id] = {
            id: t.responsible.id,
            name: t.responsible.name,
            surname: t.responsible.surname
          };
        }
      }
      const members = Object.values(membersMap);

      const plain = project.toJSON();
      plain.taskStats = { total, byStatus, overdue, progressPercent };
      plain.members = members;

      return res.json(plain);
    } catch (e) {
      next(ApiError.internal(e.message));
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { title, description, status } = req.body;

      const project = await Project.findByPk(id);
      if (!project) return next(ApiError.notFound("Проект не найден"));

      await project.update({
        title: title !== undefined ? title : project.title,
        description: description !== undefined ? description : project.description,
        status: status !== undefined ? status : project.status
      });

      return res.json(project);
    } catch (e) {
      next(ApiError.internal(e.message));
    }
  }

  async delete(req, res, next) {
    try {
        await Project.destroy({ where: { id: req.params.id } });
        return res.json({ message: "Deleted" });
    } catch(e) { next(ApiError.internal(e.message)); }
  }
}

module.exports = new ProjectController();
