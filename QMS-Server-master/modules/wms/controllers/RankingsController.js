const { Op } = require("sequelize");
const { WarehouseMovement, User, Team, Section } = require("../../../models/index");
const { ProductionOutput, OUTPUT_STATUSES } = require("../../../models/ProductionOutput");
const sequelize = require("../../../db");
const ApiError = require("../../../error/ApiError");

let BoardDefect = null;
try {
  const defectModels = require("../../../models/definitions/Defect");
  BoardDefect = defectModels.BoardDefect;
} catch (_e) {
  // Defect models not available
}

function getDateRange(period) {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  switch (period) {
    case "day":
      break;
    case "week": {
      const dow = start.getDay() || 7;
      start.setDate(start.getDate() - (dow - 1));
      break;
    }
    case "month":
      start.setDate(1);
      break;
    default: {
      const d = start.getDay() || 7;
      start.setDate(start.getDate() - (d - 1));
    }
  }
  return { start, end };
}

class RankingsController {
  async getRankings(req, res, next) {
    try {
      const { period = "week" } = req.query;
      const { start, end } = getDateRange(period);
      const startStr = start.toISOString().split("T")[0];
      const endStr = end.toISOString().split("T")[0];

      // Warehouse output by user
      const warehouseByUser = await WarehouseMovement.findAll({
        attributes: [
          "performedById",
          [sequelize.fn("SUM", sequelize.col("goodQty")), "output"],
        ],
        where: {
          performedAt: { [Op.gte]: start, [Op.lte]: end },
          performedById: { [Op.ne]: null },
          goodQty: { [Op.gt]: 0 },
        },
        group: ["performedById"],
        raw: true,
      });

      // Production output by user
      const productionByUser = await ProductionOutput.findAll({
        attributes: [
          "userId",
          [sequelize.fn("SUM", sequelize.col("approvedQty")), "output"],
        ],
        where: {
          date: { [Op.gte]: startStr, [Op.lte]: endStr },
          status: OUTPUT_STATUSES.APPROVED,
        },
        group: ["userId"],
        raw: true,
      });

      // Merge user outputs
      const userMap = new Map();
      warehouseByUser.forEach((r) => {
        const id = r.performedById;
        if (!userMap.has(id)) userMap.set(id, { output: 0, defects: 0 });
        userMap.get(id).output += Number(r.output) || 0;
      });
      productionByUser.forEach((r) => {
        const id = r.userId;
        if (!userMap.has(id)) userMap.set(id, { output: 0, defects: 0 });
        userMap.get(id).output += Number(r.output) || 0;
      });

      // Defects per user (if available)
      if (BoardDefect) {
        try {
          const defectsByUser = await BoardDefect.findAll({
            attributes: [
              "reportedById",
              [sequelize.fn("COUNT", sequelize.col("id")), "count"],
            ],
            where: { detectedAt: { [Op.gte]: start, [Op.lte]: end } },
            group: ["reportedById"],
            raw: true,
          });
          defectsByUser.forEach((r) => {
            const id = r.reportedById;
            if (userMap.has(id)) {
              userMap.get(id).defects = Number(r.count) || 0;
            }
          });
        } catch (_e) {
          // ignore
        }
      }

      // Load user details
      const userIds = [...userMap.keys()].filter(Boolean);
      let usersDb = [];
      if (userIds.length > 0) {
        usersDb = await User.findAll({
          attributes: ["id", "name", "surname", "img", "teamId"],
          where: { id: { [Op.in]: userIds } },
          include: [{ model: Team, attributes: ["id", "title"], required: false }],
          raw: false,
        });
      }

      const userInfoMap = new Map();
      usersDb.forEach((u) => {
        const p = u.get({ plain: true });
        userInfoMap.set(p.id, {
          name: p.name,
          surname: p.surname,
          avatar: p.img || null,
          teamId: p.teamId,
          teamName: p.Team?.title || "",
        });
      });

      // Build user rankings
      const users = Array.from(userMap.entries())
        .map(([id, data]) => {
          const info = userInfoMap.get(id) || {};
          const total = data.output + data.defects;
          const efficiency = total > 0 ? Math.round((data.output / total) * 100) : 100;
          return {
            id,
            name: info.name || "",
            surname: info.surname || "",
            teamName: info.teamName || "",
            avatar: info.avatar,
            output: data.output,
            defects: data.defects,
            efficiency,
            place: 0,
          };
        })
        .filter((u) => u.output > 0)
        .sort((a, b) => b.output - a.output);

      users.forEach((u, idx) => { u.place = idx + 1; });

      // Build team rankings
      const teamsMap = new Map();
      users.forEach((u) => {
        const info = userInfoMap.get(u.id);
        if (!info?.teamId) return;
        if (!teamsMap.has(info.teamId)) {
          teamsMap.set(info.teamId, {
            id: info.teamId,
            title: info.teamName || "",
            totalOutput: 0,
            totalEfficiency: 0,
            membersCount: 0,
          });
        }
        const t = teamsMap.get(info.teamId);
        t.totalOutput += u.output;
        t.totalEfficiency += u.efficiency;
        t.membersCount += 1;
      });

      // Load team details for section/lead
      const teamIds = [...teamsMap.keys()];
      let teamDetails = new Map();
      if (teamIds.length > 0) {
        const teamsDb = await Team.findAll({
          attributes: ["id", "title", "sectionId"],
          where: { id: { [Op.in]: teamIds } },
          include: [
            { model: Section, attributes: ["id", "title"], required: false },
            { model: User, as: "lead", attributes: ["name", "surname"], required: false },
          ],
          raw: false,
        });
        teamsDb.forEach((t) => {
          const p = t.get({ plain: true });
          teamDetails.set(p.id, {
            section: p.Section?.title || "",
            teamLead: p.lead ? `${p.lead.surname || ""} ${(p.lead.name || "")[0] || ""}.` : "",
          });
        });
      }

      const teams = Array.from(teamsMap.values())
        .map((t) => {
          const detail = teamDetails.get(t.id) || {};
          return {
            id: t.id,
            title: t.title,
            section: detail.section || "",
            teamLead: detail.teamLead || "",
            totalOutput: t.totalOutput,
            avgEfficiency: t.membersCount > 0 ? Math.round(t.totalEfficiency / t.membersCount) : 0,
            progress: 0,
            membersCount: t.membersCount,
          };
        })
        .sort((a, b) => b.totalOutput - a.totalOutput);

      res.json({ users: users.slice(0, 20), teams: teams.slice(0, 10) });
    } catch (e) {
      console.error("Rankings Error:", e);
      next(ApiError.internal("Ошибка загрузки рейтинга: " + e.message));
    }
  }
}

module.exports = new RankingsController();
