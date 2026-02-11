/**
 * Risk Matrix Service — ISO 14971
 * 
 * Матрица 5×5:
 *   Вероятность (1-5) × Тяжесть (1-5) = Уровень риска (1-25)
 * 
 * Классификация:
 *   1-4   = LOW      (зелёный)  — приемлемый
 *   5-9   = MEDIUM   (жёлтый)   — требует мониторинга
 *   10-15 = HIGH     (оранж)    — требует снижения
 *   16-25 = CRITICAL (красный)  — недопустимый без мер
 */

const RISK_THRESHOLDS = {
  LOW: { min: 1, max: 4 },
  MEDIUM: { min: 5, max: 9 },
  HIGH: { min: 10, max: 15 },
  CRITICAL: { min: 16, max: 25 },
};

const PROBABILITY_LABELS = {
  1: "Невероятное (< 1 раз в 10 лет)",
  2: "Маловероятное (1 раз в 5-10 лет)",
  3: "Возможное (1 раз в 1-5 лет)",
  4: "Вероятное (1 раз в год)",
  5: "Частое (> 1 раза в год)",
};

const SEVERITY_LABELS = {
  1: "Незначительное (нет влияния на пациента)",
  2: "Несущественное (временный дискомфорт)",
  3: "Серьёзное (травма, требующая лечения)",
  4: "Критическое (тяжёлая травма / инвалидность)",
  5: "Катастрофическое (смерть пациента)",
};

class RiskMatrixService {
  /**
   * Рассчитать уровень и класс риска
   */
  static calculate(probability, severity) {
    const level = probability * severity;
    const riskClass = this.classify(level);
    return { level, riskClass };
  }

  /**
   * Классифицировать уровень риска
   */
  static classify(level) {
    if (level <= RISK_THRESHOLDS.LOW.max) return "LOW";
    if (level <= RISK_THRESHOLDS.MEDIUM.max) return "MEDIUM";
    if (level <= RISK_THRESHOLDS.HIGH.max) return "HIGH";
    return "CRITICAL";
  }

  /**
   * Рассчитать RPN (Risk Priority Number) для FMEA
   * RPN = Severity × Probability × Detectability
   */
  static calculateRPN(severity, probability, detectability) {
    return severity * probability * (detectability || 1);
  }

  /**
   * Проверить допустимость остаточного риска
   * ISO 14971: если соотношение пользы/риска положительное — можно принять
   */
  static isAcceptable(riskClass) {
    return riskClass === "LOW" || riskClass === "MEDIUM";
  }

  /**
   * Получить полную матрицу 5×5 для визуализации
   */
  static getMatrix() {
    const matrix = [];
    for (let p = 5; p >= 1; p--) {
      const row = [];
      for (let s = 1; s <= 5; s++) {
        const { level, riskClass } = this.calculate(p, s);
        row.push({ probability: p, severity: s, level, riskClass });
      }
      matrix.push(row);
    }
    return matrix;
  }

  /**
   * Автогенерация номера риска
   */
  static generateRiskNumber(sequenceNumber) {
    const year = new Date().getFullYear();
    const num = String(sequenceNumber).padStart(3, "0");
    return `RISK-${year}-${num}`;
  }

  /**
   * Получить описания шкал
   */
  static getScaleLabels() {
    return {
      probability: PROBABILITY_LABELS,
      severity: SEVERITY_LABELS,
      thresholds: RISK_THRESHOLDS,
    };
  }

  /**
   * Автоматически пересчитать и обновить запись в реестре
   */
  static async recalculateRisk(riskRecord, { probability, severity, isResidual = false }) {
    const { level, riskClass } = this.calculate(probability, severity);

    if (isResidual) {
      riskRecord.residualProbability = probability;
      riskRecord.residualSeverity = severity;
      riskRecord.residualRiskLevel = level;
      riskRecord.residualRiskClass = riskClass;
    } else {
      riskRecord.initialProbability = probability;
      riskRecord.initialSeverity = severity;
      riskRecord.initialRiskLevel = level;
      riskRecord.initialRiskClass = riskClass;
    }

    await riskRecord.save();
    return { level, riskClass };
  }
}

module.exports = RiskMatrixService;
