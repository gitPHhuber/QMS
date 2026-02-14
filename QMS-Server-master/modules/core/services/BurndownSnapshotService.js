const { Sprint, SprintBurndown, ProductionTask } = require("../../../models/index");
const { Op } = require("sequelize");

class BurndownSnapshotService {

  static async updateForSprint(sprintId) {
    try {
      const sprint = await Sprint.findByPk(sprintId);
      if (!sprint || sprint.status !== "ACTIVE") return;

      const tasks = await ProductionTask.findAll({
        where: { sprintId },
        attributes: ["status"],
      });

      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t =>
        t.status === "DONE" || t.status === "CLOSED"
      ).length;
      const remainingTasks = totalTasks - completedTasks;

      // Calculate ideal remaining
      let idealRemaining = null;
      if (sprint.startDate && sprint.endDate) {
        const start = new Date(sprint.startDate);
        const end = new Date(sprint.endDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const totalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
        const elapsed = Math.max(0, Math.ceil((today - start) / (1000 * 60 * 60 * 24)));
        idealRemaining = Math.max(0, totalTasks * (1 - elapsed / totalDays));
      }

      const todayStr = new Date().toISOString().split("T")[0];

      // Upsert burndown point for today
      const existing = await SprintBurndown.findOne({
        where: { sprintId, date: todayStr },
      });

      if (existing) {
        await existing.update({ totalTasks, completedTasks, remainingTasks, idealRemaining });
      } else {
        await SprintBurndown.create({
          sprintId,
          date: todayStr,
          totalTasks,
          completedTasks,
          remainingTasks,
          idealRemaining,
        });
      }
    } catch (e) {
      console.error("[BurndownSnapshotService] error:", e.message);
    }
  }

  static async updateForTask(taskId) {
    try {
      const task = await ProductionTask.findByPk(taskId, { attributes: ["sprintId"] });
      if (task && task.sprintId) {
        await this.updateForSprint(task.sprintId);
      }
    } catch (e) {
      console.error("[BurndownSnapshotService] updateForTask error:", e.message);
    }
  }

  static async createIdealBurndown(sprintId) {
    try {
      const sprint = await Sprint.findByPk(sprintId);
      if (!sprint || !sprint.startDate || !sprint.endDate) return;

      const tasks = await ProductionTask.count({ where: { sprintId } });
      const start = new Date(sprint.startDate);
      const end = new Date(sprint.endDate);
      const totalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));

      // Create ideal burndown points for each day
      for (let day = 0; day <= totalDays; day++) {
        const date = new Date(start);
        date.setDate(date.getDate() + day);
        const dateStr = date.toISOString().split("T")[0];
        const ideal = tasks * (1 - day / totalDays);

        const existing = await SprintBurndown.findOne({
          where: { sprintId, date: dateStr },
        });

        if (existing) {
          await existing.update({ idealRemaining: ideal });
        } else {
          await SprintBurndown.create({
            sprintId,
            date: dateStr,
            totalTasks: tasks,
            completedTasks: 0,
            remainingTasks: tasks,
            idealRemaining: ideal,
          });
        }
      }
    } catch (e) {
      console.error("[BurndownSnapshotService] createIdealBurndown error:", e.message);
    }
  }
}

module.exports = BurndownSnapshotService;
