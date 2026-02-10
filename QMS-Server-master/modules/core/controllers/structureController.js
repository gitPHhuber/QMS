const { Section, Team, User, Role } = require("../../../models/index");
const ApiError = require("../../../error/ApiError");
const { logAudit } = require("../utils/auditLogger");
const { Op } = require("sequelize");

class StructureController {

  async getFullStructure(req, res, next) {
    try {
      const structure = await Section.findAll({
        include: [
          {
            model: User,
            as: "manager",
            attributes: ["id", "name", "surname", "img"],
          },
          {
            model: Team,
            as: "teams",
            include: [
              {
                model: User,
                as: "teamLead",
                attributes: ["id", "name", "surname", "img"],
              },
              {
                model: User,
                attributes: ["id", "name", "surname", "img"],
              },

              {
                model: Section,
                as: "section",
                attributes: ["id", "title"],
              },
            ],
          },
        ],
        order: [["id", "ASC"]],
      });
      return res.json(structure);
    } catch (e) {
      next(ApiError.badRequest(e.message));
    }
  }


  async getUnassignedUsers(req, res, next) {
    try {
      const superAdminRole = await Role.findOne({ where: { name: "SUPER_ADMIN" } });
      const whereClause = { teamId: { [Op.is]: null } };
      if (superAdminRole) {
        whereClause.roleId = { [Op.ne]: superAdminRole.id };
      }
      const users = await User.findAll({
        where: whereClause,
        attributes: ["id", "name", "surname", "login", "img"],
        include: [{ model: Role, as: "userRole", attributes: ["name"] }],
        order: [["surname", "ASC"]]
      });
      return res.json(users);
    } catch (e) {
      next(ApiError.badRequest(e.message));
    }
  }

  async createSection(req, res, next) {
    try {
      const { title } = req.body;
      const section = await Section.create({ title });

      await logAudit({
        req,
        action: "SECTION_CREATE",
        entity: "Section",
        entityId: section.id,
        description: `Создан участок "${title}"`,
      });

      return res.json(section);
    } catch (e) {
      next(ApiError.badRequest(e.message));
    }
  }

  async createTeam(req, res, next) {
    try {
      const { title, sectionId } = req.body;

      const team = await Team.create({ title, sectionId });

      await logAudit({
        req,
        action: "TEAM_CREATE",
        entity: "Team",
        entityId: team.id,
        description: `Создана бригада "${title}" в участке ${sectionId}`,
      });

      return res.json(team);
    } catch (e) {
      next(ApiError.badRequest(e.message));
    }
  }

  async assignSectionManager(req, res, next) {
    try {
      const { sectionId, userId } = req.body;

      const section = await Section.findByPk(sectionId);
      if (!section) {
        return next(ApiError.notFound("Участок не найден"));
      }

      await section.update({ managerId: userId });

      await logAudit({
        req,
        action: "SECTION_MANAGER_ASSIGN",
        entity: "Section",
        entityId: sectionId,
        description: `Назначен менеджер ${userId} на участок ${sectionId}`,
      });

      return res.json(section);
    } catch (e) {
      next(ApiError.badRequest(e.message));
    }
  }

  async assignTeamLead(req, res, next) {
    try {
      const { teamId, userId } = req.body;

      const team = await Team.findByPk(teamId);
      if (!team) {
        return next(ApiError.notFound("Бригада не найдена"));
      }

      await team.update({ teamLeadId: userId });

      await logAudit({
        req,
        action: "TEAM_LEAD_ASSIGN",
        entity: "Team",
        entityId: teamId,
        description: `Назначен бригадир ${userId} на бригаду ${teamId}`,
      });

      return res.json(team);
    } catch (e) {
      next(ApiError.badRequest(e.message));
    }
  }

  async addMemberToTeam(req, res, next) {
    try {
      const { teamId, userId } = req.body;

      const user = await User.findByPk(userId);
      if (!user) {
        return next(ApiError.notFound("Пользователь не найден"));
      }

      await user.update({ teamId });

      await logAudit({
        req,
        action: "USER_TEAM_ASSIGN",
        entity: "User",
        entityId: userId,
        description: `Пользователь ${userId} добавлен в бригаду ${teamId}`,
      });

      return res.json(user);
    } catch (e) {
      next(ApiError.badRequest(e.message));
    }
  }

  async removeMemberFromTeam(req, res, next) {
    try {
      const { userId } = req.body;

      const user = await User.findByPk(userId);
      if (!user) {
        return next(ApiError.notFound("Пользователь не найден"));
      }

      const previousTeamId = user.teamId;
      await user.update({ teamId: null });

      await logAudit({
        req,
        action: "USER_TEAM_REMOVE",
        entity: "User",
        entityId: userId,
        description: `Пользователь ${userId} удалён из бригады ${previousTeamId}`,
      });

      return res.json(user);
    } catch (e) {
      next(ApiError.badRequest(e.message));
    }
  }
}

module.exports = new StructureController();
