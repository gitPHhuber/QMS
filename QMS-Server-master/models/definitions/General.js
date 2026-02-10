/**
 * General.js — обновлённая модель AuditLog с hash-chain полями
 * 
 * ЗАМЕНА: models/definitions/General.js
 * ИЗМЕНЕНИЯ: AuditLog расширен полями chainIndex, prevHash, currentHash, 
 *            dataHash, signedBy, signedAt, severity
 * 
 * Остальные модели (User, PC, Session, Role, Ability, RoleAbility) — без изменений.
 */

const sequelize = require("../../db");
const { DataTypes } = require("sequelize");

// ─── Без изменений ───────────────────────────────────────────────

const User = sequelize.define("user", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  login: { type: DataTypes.STRING, unique: true },
  password: { type: DataTypes.STRING },
  role: { type: DataTypes.STRING, defaultValue: "USER" },
  name: { type: DataTypes.STRING },
  surname: { type: DataTypes.STRING },
  img: { type: DataTypes.STRING },
});

const PC = sequelize.define("PC", {
  id: { type: DataTypes.SMALLINT, primaryKey: true, autoIncrement: true },
  ip: { type: DataTypes.STRING, unique: true, allowNull: false },
  pc_name: { type: DataTypes.STRING, allowNull: false },
  cabinet: { type: DataTypes.STRING },
});

const Session = sequelize.define("session", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  online: { type: DataTypes.BOOLEAN },
  PCId: {
    type: DataTypes.SMALLINT,
    allowNull: true,
    references: {
      model: "PCs",
      key: "id",
    },
  },
});

// ─── ОБНОВЛЕНО: AuditLog + hash-chain ────────────────────────────

const AuditLog = sequelize.define("audit_log", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: true },
  action: { type: DataTypes.STRING, allowNull: false },
  entity: { type: DataTypes.STRING, allowNull: true },
  entityId: { type: DataTypes.STRING, allowNull: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  metadata: { type: DataTypes.JSON, allowNull: true },

  // ── Hash-chain поля (ISO 13485 §4.2.5) ──
  chainIndex: {
    type: DataTypes.BIGINT,
    allowNull: true,
    
    comment: "Порядковый номер в hash-цепочке (глобальный)",
  },
  prevHash: {
    type: DataTypes.STRING(64),
    allowNull: true,
    comment: "SHA-256 хеш предыдущей записи в цепочке",
  },
  currentHash: {
    type: DataTypes.STRING(64),
    allowNull: true,
    comment: "SHA-256 хеш текущей записи (включая prevHash)",
  },
  dataHash: {
    type: DataTypes.STRING(64),
    allowNull: true,
    comment: "SHA-256 только данных (без chain-полей) — для детекции изменений",
  },

  // ── Электронная подпись (подготовка) ──
  signedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: "userId подтвердившего запись",
  },
  signedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },

  // ── QMS-классификация ──
  severity: {
    type: DataTypes.ENUM("INFO", "WARNING", "CRITICAL", "SECURITY"),
    allowNull: false,
    defaultValue: "INFO",
    comment: "Уровень значимости для QMS отчётов",
  },
});

// ─── Без изменений ───────────────────────────────────────────────

const Role = sequelize.define("role", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  code: { type: DataTypes.STRING, unique: true, allowNull: false },
  name: { type: DataTypes.STRING, unique: true, allowNull: false },
  description: { type: DataTypes.STRING },
});

const Ability = sequelize.define("ability", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  code: { type: DataTypes.STRING, unique: true, allowNull: false },
  description: { type: DataTypes.STRING },
});

const RoleAbility = sequelize.define("role_ability", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
});

module.exports = {
  User,
  PC,
  Session,
  AuditLog,
  Role,
  Ability,
  RoleAbility,
};
