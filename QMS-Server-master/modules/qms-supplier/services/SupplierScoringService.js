/**
 * Supplier Scoring Service — ISO 13485 §7.4.1
 * 
 * Взвешенная оценка поставщиков:
 *   Качество     × 0.30 (30%)
 *   Сроки        × 0.20 (20%)
 *   Документация  × 0.20 (20%)
 *   Коммуникация  × 0.10 (10%)
 *   Цена         × 0.10 (10%)
 *   Соответствие × 0.10 (10%)
 * 
 * Итог: балл 0-100
 *   ≥ 80 = APPROVED
 *   60-79 = CONDITIONALLY_APPROVED (требуются корректирующие действия)
 *   < 60  = REJECTED / SUSPENDED
 */

const WEIGHTS = {
  qualityScore: 0.30,
  deliveryScore: 0.20,
  documentationScore: 0.20,
  communicationScore: 0.10,
  priceScore: 0.10,
  complianceScore: 0.10,
};

const DECISION_THRESHOLDS = {
  APPROVED: 80,
  CONDITIONALLY_APPROVED: 60,
  // ниже 60 = REJECTED
};

// Периоды переоценки в месяцах по критичности
const EVALUATION_PERIODS = {
  CRITICAL: 6,   // каждые 6 месяцев
  MAJOR: 12,     // ежегодно
  MINOR: 24,     // каждые 2 года
};

class SupplierScoringService {
  /**
   * Рассчитать взвешенный балл
   */
  static calculateScore(scores) {
    let total = 0;
    let weightSum = 0;

    for (const [field, weight] of Object.entries(WEIGHTS)) {
      const value = scores[field];
      if (value !== null && value !== undefined) {
        total += value * weight;
        weightSum += weight;
      }
    }

    // Нормализуем к 100-балльной шкале (10 × 10 = 100)
    return weightSum > 0 ? Math.round((total / weightSum) * 10) : 0;
  }

  /**
   * Определить решение на основе балла
   */
  static determineDecision(score) {
    if (score >= DECISION_THRESHOLDS.APPROVED) return "APPROVED";
    if (score >= DECISION_THRESHOLDS.CONDITIONALLY_APPROVED) return "CONDITIONALLY_APPROVED";
    return "REJECTED";
  }

  /**
   * Рассчитать дату следующей оценки
   */
  static getNextEvaluationDate(criticality) {
    const months = EVALUATION_PERIODS[criticality] || 12;
    const next = new Date();
    next.setMonth(next.getMonth() + months);
    return next;
  }

  /**
   * Рассчитать метрики из поставок (интеграция с существующей Supply моделью)
   */
  static calculateDeliveryMetrics(supplies) {
    const total = supplies.length;
    if (total === 0) return { totalOrders: 0, defectiveOrders: 0, lateDeliveries: 0, defectRate: 0 };

    const defective = supplies.filter(s => s.hasDefects || s.status === "REJECTED").length;
    const late = supplies.filter(s => {
      if (!s.expectedDate || !s.actualDate) return false;
      return new Date(s.actualDate) > new Date(s.expectedDate);
    }).length;

    return {
      totalOrders: total,
      defectiveOrders: defective,
      lateDeliveries: late,
      defectRate: Math.round((defective / total) * 100),
      onTimeRate: Math.round(((total - late) / total) * 100),
    };
  }

  /**
   * Получить конфигурацию весов и порогов
   */
  static getConfig() {
    return {
      weights: WEIGHTS,
      thresholds: DECISION_THRESHOLDS,
      evaluationPeriods: EVALUATION_PERIODS,
    };
  }
}

module.exports = SupplierScoringService;
