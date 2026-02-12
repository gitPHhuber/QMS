const { Op } = require("sequelize");
const { RiskRegister, RiskAssessment, RiskMitigation } = require("../models/Risk");
const { Notification } = require("../../core/models/Notification");
const { logAudit } = require("../../core/utils/auditLogger");

const LEVEL_RANK = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

const DEFAULT_MONITOR_INTERVAL_MS = 60 * 60 * 1000;
const DEFAULT_DEDUP_PERIOD_MS = 24 * 60 * 60 * 1000;

const dedupCache = new Map();

function envNumber(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function getRecipients(risk, mitigations = []) {
  const recipients = new Set();
  if (risk.ownerId) recipients.add(risk.ownerId);

  for (const mitigation of mitigations) {
    if (mitigation?.responsibleId) recipients.add(mitigation.responsibleId);
  }

  return [...recipients];
}

function shouldSendDeduped(key, dedupPeriodMs) {
  const now = Date.now();
  const lastSentAt = dedupCache.get(key);

  return !lastSentAt || now - lastSentAt >= dedupPeriodMs;
}

function markDeduped(key) {
  dedupCache.set(key, Date.now());
}

class RiskMonitoringService {
  static isLevelIncreased(previousClass, nextClass) {
    if (!previousClass || !nextClass) return false;
    return (LEVEL_RANK[nextClass] || 0) > (LEVEL_RANK[previousClass] || 0);
  }

  static isHighOrCritical(riskClass) {
    return riskClass === "HIGH" || riskClass === "CRITICAL";
  }

  static async sendRiskNotification({
    risk,
    title,
    message,
    severity,
    dedupKeyBase,
    dedupPeriodMs,
    metadata,
  }) {
    const mitigations = await RiskMitigation.findAll({
      where: { riskRegisterId: risk.id },
      attributes: ["responsibleId"],
    });

    const recipients = getRecipients(risk, mitigations);

    for (const userId of recipients) {
      const dedupKey = `${dedupKeyBase}:${risk.id}:${userId}`;
      if (!shouldSendDeduped(dedupKey, dedupPeriodMs)) continue;

      await Notification.create({
        userId,
        type: "GENERAL",
        title,
        message,
        severity,
        entityType: "risk_register",
        entityId: risk.id,
        link: `/qms/risks/${risk.id}`,
      });

      await logAudit({
        userId,
        action: "risk.notify.level_changed",
        entity: "risk_register",
        entityId: risk.id,
        description: title,
        metadata,
      });

      // Mark dedup AFTER successful notification + audit to avoid silent loss on failure
      markDeduped(dedupKey);
    }
  }

  static async notifyLevelChanged({ risk, previousClass, nextClass, source = "assessment", actorUserId = null }) {
    if (!this.isLevelIncreased(previousClass, nextClass) || !this.isHighOrCritical(nextClass)) {
      return;
    }

    const dedupPeriodMs = envNumber("RISK_NOTIFY_DEDUP_PERIOD_MS", DEFAULT_DEDUP_PERIOD_MS);

    await this.sendRiskNotification({
      risk,
      title: `Рост уровня риска: ${risk.riskNumber || `#${risk.id}`}`,
      message: `Класс риска повышен ${previousClass} → ${nextClass}. Источник: ${source}.`,
      severity: nextClass === "CRITICAL" ? "CRITICAL" : "WARNING",
      dedupKeyBase: `risk-level-up:${source}:${previousClass}:${nextClass}`,
      dedupPeriodMs,
      metadata: {
        source,
        previousClass,
        nextClass,
        actorUserId,
      },
    });
  }

  static async notifyOverdueRisk(risk) {
    const dedupPeriodMs = envNumber("RISK_NOTIFY_DEDUP_PERIOD_MS", DEFAULT_DEDUP_PERIOD_MS);

    await this.sendRiskNotification({
      risk,
      title: `Просрочен пересмотр риска: ${risk.riskNumber || `#${risk.id}`}`,
      message: `Дата пересмотра риска истекла (${risk.reviewDate ? new Date(risk.reviewDate).toISOString() : "N/A"}).`,
      severity: "WARNING",
      dedupKeyBase: "risk-overdue-review",
      dedupPeriodMs,
      metadata: {
        reviewDate: risk.reviewDate,
      },
    });
  }

  static async findOverdueRisks(now = new Date()) {
    return RiskRegister.findAll({
      where: {
        reviewDate: { [Op.lt]: now },
        status: { [Op.notIn]: ["CLOSED", "ACCEPTED"] },
      },
      attributes: ["id", "riskNumber", "ownerId", "reviewDate", "status"],
    });
  }

  static async findLevelEscalatedRisks() {
    const risks = await RiskRegister.findAll({
      where: {
        status: { [Op.notIn]: ["CLOSED", "ACCEPTED"] },
      },
      include: [{
        model: RiskAssessment,
        as: "assessments",
        attributes: ["id", "assessmentDate", "riskClass"],
      }],
      attributes: ["id", "riskNumber", "ownerId", "status"],
    });

    return risks
      .map((risk) => {
        const assessments = [...(risk.assessments || [])].sort(
          (a, b) => new Date(b.assessmentDate) - new Date(a.assessmentDate)
        );

        if (assessments.length < 2) return null;

        const latest = assessments[0];
        const previous = assessments[1];

        if (!this.isLevelIncreased(previous.riskClass, latest.riskClass)) return null;
        if (!this.isHighOrCritical(latest.riskClass)) return null;

        return { risk, previousClass: previous.riskClass, nextClass: latest.riskClass };
      })
      .filter(Boolean);
  }

  static async runCycle() {
    const now = new Date();

    const overdueRisks = await this.findOverdueRisks(now);
    for (const risk of overdueRisks) {
      await logAudit({
        action: "risk.monitor.overdue",
        entity: "risk_register",
        entityId: risk.id,
        description: "Автопроверка: обнаружен просроченный пересмотр риска",
        metadata: {
          reviewDate: risk.reviewDate,
          status: risk.status,
        },
      });

      await this.notifyOverdueRisk(risk);
    }

    const escalatedRisks = await this.findLevelEscalatedRisks();
    for (const item of escalatedRisks) {
      await this.notifyLevelChanged({
        risk: item.risk,
        previousClass: item.previousClass,
        nextClass: item.nextClass,
        source: "monitoring",
      });
    }

    return {
      overdueCount: overdueRisks.length,
      escalatedCount: escalatedRisks.length,
    };
  }

  static startScheduler() {
    const raw = (process.env.RISK_MONITOR_ENABLED || "true").toLowerCase();
    const enabled = raw !== "false" && raw !== "0";
    if (!enabled) {
      console.log("[RiskMonitoring] disabled by RISK_MONITOR_ENABLED");
      return null;
    }

    const intervalMs = envNumber("RISK_MONITOR_INTERVAL_MS", DEFAULT_MONITOR_INTERVAL_MS);

    const runSafely = async () => {
      try {
        const result = await this.runCycle();
        console.log(`[RiskMonitoring] done: overdue=${result.overdueCount}, escalated=${result.escalatedCount}`);
      } catch (error) {
        console.error("[RiskMonitoring] failed:", error.message);
      }
    };

    runSafely();
    const timer = setInterval(runSafely, intervalMs);
    if (typeof timer.unref === "function") timer.unref();

    return timer;
  }
}

module.exports = RiskMonitoringService;
