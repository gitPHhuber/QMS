const sequelize = require("../../../db");
const { DataTypes } = require("sequelize");

// ═══════════════════════════════════════════════════════════════
// Device Master File (DMF) — ISO 13485 §4.2.3
// Структура технического досье медицинского изделия
// ═══════════════════════════════════════════════════════════════

const DmfSection = sequelize.define("dmf_section", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  productId: { type: DataTypes.INTEGER, allowNull: false },

  sectionCode: {
    type: DataTypes.ENUM(
      "DEVICE_DESCRIPTION",     // 1. Описание изделия
      "DESIGN_SPECS",           // 2. Проектная документация
      "MANUFACTURING",          // 3. Производственная документация
      "RISK_ANALYSIS",          // 4. Анализ рисков (ISO 14971)
      "VERIFICATION",           // 5. Верификация проекта
      "VALIDATION",             // 6. Валидация проекта
      "LABELING",               // 7. Маркировка и упаковка
      "IOM",                    // 8. Инструкция по эксплуатации
      "BIOCOMPATIBILITY",       // 9. Биосовместимость (ISO 10993)
      "ELECTRICAL_SAFETY",      // 10. Электробезопасность (IEC 60601)
      "EMC",                    // 11. ЭМС (IEC 60601-1-2)
      "SOFTWARE",               // 12. ПО (IEC 62304)
      "STERILIZATION",          // 13. Стерилизация
      "CLINICAL_EVALUATION",    // 14. Клиническая оценка
      "POST_MARKET",            // 15. Пострегистрационный мониторинг
      "REGULATORY_SUBMISSION"   // 16. Регуляторное досье
    ),
    allowNull: false,
  },
  title: { type: DataTypes.STRING(500), allowNull: false },
  description: { type: DataTypes.TEXT },

  status: {
    type: DataTypes.ENUM("NOT_STARTED", "IN_PROGRESS", "COMPLETE", "NEEDS_UPDATE"),
    defaultValue: "NOT_STARTED",
  },

  documentIds: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: "Массив ID документов из DMS",
  },

  sortOrder: { type: DataTypes.INTEGER, defaultValue: 0 },

  lastReviewedAt: { type: DataTypes.DATE },
  lastReviewedById: { type: DataTypes.INTEGER },
  notes: { type: DataTypes.TEXT },
});

module.exports = { DmfSection };
