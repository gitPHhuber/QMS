#!/usr/bin/env node

/**
 * scripts/db-reset.js
 *
 * Пересоздаёт все таблицы по моделям Sequelize (force: true)
 * и вставляет начальные данные (роли, abilities, матрицу прав).
 *
 * Использование:
 *   npm run db:reset
 *   node scripts/db-reset.js
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const sequelize = require("../db");
const models = require("../models/index");

async function main() {
  console.log("=== ASVO-QMS: Полный сброс базы данных ===\n");

  console.log(`  Host:     ${process.env.DB_HOST}:${process.env.DB_PORT}`);
  console.log(`  Database: ${process.env.DB_NAME}`);
  console.log(`  User:     ${process.env.DB_USER}\n`);

  // 1. Проверка подключения
  try {
    await sequelize.authenticate();
    console.log("[OK] Подключение к PostgreSQL установлено.");
  } catch (e) {
    console.error("[FAIL] Не удалось подключиться к PostgreSQL:");
    console.error(`  ${e.message}`);
    console.error("\nПроверьте настройки в .env и убедитесь, что PostgreSQL запущен.");
    process.exit(1);
  }

  // 2. Пересоздание всех таблиц
  console.log("\n[...] Пересоздание таблиц (sync force: true)...");
  try {
    await sequelize.sync({ force: true });
    console.log("[OK] Все таблицы пересозданы по моделям.");
  } catch (e) {
    console.error("[FAIL] Ошибка при пересоздании таблиц:", e.message);
    process.exit(1);
  }

  // 3. Вставка начальных данных
  console.log("\n[...] Вставка начальных данных (abilities)...");

  const permissions = [
    { code: "rbac.manage", description: "Управление ролями и матрицей прав" },
    { code: "users.manage", description: "Назначение ролей пользователям" },
    { code: "warehouse.view", description: "Просмотр остатков" },
    { code: "warehouse.manage", description: "Приемка, создание коробок, перемещение" },
    { code: "labels.print", description: "Печать этикеток" },
    { code: "dms.view", description: "Просмотр реестра документов" },
    { code: "dms.create", description: "Создание документов" },
    { code: "dms.approve", description: "Согласование документов" },
    { code: "dms.manage", description: "Введение в действие, рассылка" },
    { code: "qms.audit.view", description: "Расширенный аудит-лог" },
    { code: "qms.audit.verify", description: "Верификация hash-chain" },
    { code: "qms.audit.report", description: "Отчёты для инспекции" },
    { code: "nc.view", description: "Просмотр несоответствий" },
    { code: "nc.create", description: "Регистрация NC" },
    { code: "nc.manage", description: "Управление NC" },
    { code: "capa.view", description: "Просмотр CAPA" },
    { code: "capa.create", description: "Создание CAPA" },
    { code: "capa.manage", description: "Управление CAPA" },
    { code: "capa.verify", description: "Проверка эффективности CAPA" },
    { code: "risk.read", description: "Просмотр реестра рисков" },
    { code: "risk.create", description: "Идентификация рисков" },
    { code: "risk.update", description: "Обновление оценки рисков" },
    { code: "risk.assess", description: "Проведение оценки рисков" },
    { code: "risk.accept", description: "Принятие остаточного риска" },
    { code: "supplier.read", description: "Просмотр поставщиков" },
    { code: "supplier.manage", description: "Управление поставщиками" },
    { code: "training.read", description: "Просмотр записей обучения" },
    { code: "training.manage", description: "Управление обучением" },
    { code: "equipment.read", description: "Просмотр оборудования" },
    { code: "equipment.calibrate", description: "Калибровка/поверка" },
    { code: "review.read", description: "Просмотр анализа руководства" },
    { code: "review.manage", description: "Проведение анализа руководства" },
    { code: "analytics.view", description: "Просмотр дашбордов и KPI" },
    { code: "audit.log.view", description: "Просмотр журнала аудита" },
  ];

  for (const p of permissions) {
    await models.Ability.findOrCreate({ where: { code: p.code }, defaults: p });
  }
  console.log(`[OK] Abilities: ${permissions.length} записей.`);

  // 4. Вставка ролей
  console.log("[...] Вставка ролей...");

  const rolesData = [
    { code: "SUPER_ADMIN", name: "SUPER_ADMIN", description: "Полный доступ" },
    { code: "QMS_DIRECTOR", name: "QMS_DIRECTOR", description: "Директор по качеству" },
    { code: "QMS_ENGINEER", name: "QMS_ENGINEER", description: "Инженер по качеству" },
    { code: "QMS_AUDITOR", name: "QMS_AUDITOR", description: "Внутренний аудитор" },
    { code: "DOC_CONTROLLER", name: "DOC_CONTROLLER", description: "Управление документацией" },
    { code: "QC_ENGINEER", name: "QC_ENGINEER", description: "Инженер ОТК" },
    { code: "WAREHOUSE_MASTER", name: "WAREHOUSE_MASTER", description: "Кладовщик" },
    { code: "VIEWER", name: "VIEWER", description: "Наблюдатель — только просмотр" },
  ];

  for (const roleData of rolesData) {
    await models.Role.findOrCreate({
      where: { code: roleData.code },
      defaults: roleData,
    });
  }
  console.log(`[OK] Roles: ${rolesData.length} записей.`);

  // 5. Назначение прав ролям
  console.log("[...] Назначение abilities ролям...");

  const assign = async (roleName, slugs) => {
    const role = await models.Role.findOne({ where: { name: roleName } });
    if (!role) {
      console.warn(`  [WARN] Роль ${roleName} не найдена, пропуск.`);
      return;
    }

    let abilities;
    if (slugs === "*") {
      abilities = await models.Ability.findAll();
    } else {
      abilities = await models.Ability.findAll({ where: { code: slugs } });
    }

    if (abilities.length) {
      await role.setAbilities(abilities);
      console.log(`  ${roleName}: ${abilities.length} прав`);
    }
  };

  await assign("SUPER_ADMIN", "*");

  await assign("QMS_DIRECTOR", [
    "dms.view", "dms.create", "dms.approve", "dms.manage",
    "nc.view", "nc.create", "nc.manage",
    "capa.view", "capa.create", "capa.manage", "capa.verify",
    "risk.read", "risk.create", "risk.update", "risk.assess", "risk.accept",
    "supplier.read", "supplier.manage",
    "training.read", "training.manage",
    "equipment.read", "equipment.calibrate",
    "review.read", "review.manage",
    "qms.audit.view", "qms.audit.verify", "qms.audit.report",
    "analytics.view", "audit.log.view",
    "warehouse.view", "rbac.manage", "users.manage",
  ]);

  await assign("QMS_ENGINEER", [
    "dms.view", "dms.create",
    "nc.view", "nc.create", "nc.manage",
    "capa.view", "capa.create",
    "risk.read", "risk.create", "risk.update", "risk.assess",
    "supplier.read",
    "training.read", "training.manage",
    "equipment.read", "equipment.calibrate",
    "review.read",
    "qms.audit.view",
    "analytics.view", "audit.log.view",
  ]);

  await assign("QMS_AUDITOR", [
    "dms.view",
    "nc.view",
    "capa.view",
    "risk.read",
    "supplier.read",
    "training.read",
    "equipment.read",
    "review.read",
    "qms.audit.view", "qms.audit.verify", "qms.audit.report",
    "analytics.view", "audit.log.view",
  ]);

  await assign("DOC_CONTROLLER", [
    "dms.view", "dms.create", "dms.approve", "dms.manage",
    "training.read",
    "analytics.view",
  ]);

  await assign("QC_ENGINEER", [
    "warehouse.view",
    "nc.view", "nc.create", "nc.manage",
    "capa.view", "capa.create", "capa.manage", "capa.verify",
    "qms.audit.view",
    "risk.read",
    "equipment.read",
  ]);

  await assign("WAREHOUSE_MASTER", [
    "warehouse.view", "warehouse.manage", "labels.print",
    "supplier.read",
    "nc.view", "nc.create",
    "dms.view",
  ]);

  await assign("VIEWER", [
    "dms.view", "nc.view", "capa.view", "risk.read",
    "supplier.read", "training.read", "equipment.read",
    "review.read", "analytics.view",
  ]);

  console.log("[OK] Матрица прав назначена.\n");

  console.log("=== Готово. База данных инициализирована. ===");
  console.log("Запустите сервер: npm run dev\n");

  await sequelize.close();
  process.exit(0);
}

main().catch((e) => {
  console.error("\n[FATAL]", e);
  process.exit(1);
});
