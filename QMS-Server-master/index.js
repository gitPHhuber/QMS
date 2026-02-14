require("dotenv").config();
const express = require("express");
const sequelize = require("./db");
const { moduleManager } = require('./config/modules');
const models = require("./models/index");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const router = require("./routes/index");
const errorHandler = require("./middleware/ErrorHandlingMiddleware");
const path = require("path");
const { startAuditRetentionScheduler } = require("./modules/core/utils/auditRetentionService");
const RiskMonitoringService = require("./modules/qms-risk/services/RiskMonitoringService");

const { apiLimiter } = require("./middleware/rateLimitMiddleware");
const { refreshToken, logoutToken } = require("./middleware/refreshTokenMiddleware");
const licenseService = require("./services/LicenseService");
const licenseMiddleware = require("./middleware/licenseMiddleware");

const PORT = process.env.PORT || 5000;
const app = express();

app.use(express.json());

const corsOptions = {
  origin: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((s) => s.trim())
    : "http://localhost:3000",
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.static(path.resolve(__dirname, "static")));
app.use(fileUpload({}));


// Healthcheck endpoints (no auth required)
const healthRouter = require("./modules/core/routes/healthRouter");
app.use("/api", healthRouter);

// Rate limiting
app.use("/api", apiLimiter);

// License enforcement (read-only mode if expired beyond grace)
app.use("/api", licenseMiddleware);

// Auth token refresh endpoints
app.post("/api/auth/refresh", refreshToken);
app.post("/api/auth/logout", logoutToken);

app.use("/api", router);


app.use(errorHandler);

const initInitialData = async () => {
  const transaction = await sequelize.transaction();
  try {
    console.log(">>> [RBAC] Начинаем инициализацию ролей и прав...");

    const txOpt = { transaction };

    const permissions = [
      // Система
      { code: "rbac.manage", description: "Управление ролями и матрицей прав" },
      { code: "users.manage", description: "Назначение ролей пользователям" },

      // Склад
      { code: "warehouse.view", description: "Просмотр остатков" },
      { code: "warehouse.manage", description: "Приемка, создание коробок, перемещение" },
      { code: "labels.print", description: "Печать этикеток" },

      // QMS: DMS
      { code: "dms.view", description: "Просмотр реестра документов" },
      { code: "dms.create", description: "Создание документов" },
      { code: "dms.approve", description: "Согласование документов" },
      { code: "dms.manage", description: "Введение в действие, рассылка" },

      // QMS: Audit
      { code: "qms.audit.view", description: "Расширенный аудит-лог" },
      { code: "qms.audit.verify", description: "Верификация hash-chain" },
      { code: "qms.audit.report", description: "Отчёты для инспекции" },

      // QMS: NC
      { code: "nc.view", description: "Просмотр несоответствий" },
      { code: "nc.create", description: "Регистрация NC" },
      { code: "nc.manage", description: "Управление NC" },

      // QMS: CAPA
      { code: "capa.view", description: "Просмотр CAPA" },
      { code: "capa.create", description: "Создание CAPA" },
      { code: "capa.manage", description: "Управление CAPA" },
      { code: "capa.verify", description: "Проверка эффективности CAPA" },

      // QMS: Риски
      { code: "risk.read", description: "Просмотр реестра рисков" },
      { code: "risk.create", description: "Идентификация рисков" },
      { code: "risk.update", description: "Обновление оценки рисков" },
      { code: "risk.assess", description: "Проведение оценки рисков" },
      { code: "risk.accept", description: "Принятие остаточного риска" },

      // Поставщики
      { code: "supplier.read", description: "Просмотр поставщиков" },
      { code: "supplier.manage", description: "Управление поставщиками" },

      // Обучение
      { code: "training.read", description: "Просмотр записей обучения" },
      { code: "training.manage", description: "Управление обучением" },

      // Оборудование
      { code: "equipment.read", description: "Просмотр оборудования" },
      { code: "equipment.calibrate", description: "Калибровка/поверка" },

      // Анализ руководства
      { code: "review.read", description: "Просмотр анализа руководства" },
      { code: "review.manage", description: "Проведение анализа руководства" },

      // Рекламации
      { code: "complaint.read", description: "Просмотр рекламаций" },
      { code: "complaint.create", description: "Создание рекламаций" },
      { code: "complaint.manage", description: "Управление рекламациями" },

      // Управление изменениями
      { code: "change.read", description: "Просмотр запросов на изменение" },
      { code: "change.create", description: "Создание запросов на изменение" },
      { code: "change.approve", description: "Одобрение изменений" },

      // Валидация процессов
      { code: "validation.read", description: "Просмотр валидаций" },
      { code: "validation.manage", description: "Управление валидациями" },

      // Реестр изделий
      { code: "product.read", description: "Просмотр реестра изделий" },
      { code: "product.manage", description: "Управление реестром изделий" },

      // Управление проектированием (§7.3)
      { code: "design.view", description: "Просмотр проектов Design Control" },
      { code: "design.create", description: "Создание проектов и элементов Design Control" },
      { code: "design.manage", description: "Управление проектированием" },
      { code: "design.approve", description: "Одобрение результатов проектирования" },

      // Электронные подписи (21 CFR Part 11)
      { code: "esign.view", description: "Просмотр электронных подписей" },
      { code: "esign.sign", description: "Подписание документов" },
      { code: "esign.request", description: "Создание запросов на подпись" },
      { code: "esign.manage", description: "Управление политиками подписей" },

      // Оборудование — управление средой
      { code: "equipment.manage", description: "Управление оборудованием и мониторингом среды" },

      // DHR — История устройства (§7.5.9)
      { code: "dhr.read", description: "Просмотр записей истории устройства" },
      { code: "dhr.create", description: "Создание DHR" },
      { code: "dhr.manage", description: "Управление DHR и выпуск продукции" },

      // Аналитика
      { code: "analytics.view", description: "Просмотр дашбордов и KPI" },
      { code: "audit.log.view", description: "Просмотр журнала аудита" },

      // Администрирование
      { code: "admin.access", description: "Доступ к панели администрирования" },
    ];

    for (const p of permissions) {
      await models.Ability.findOrCreate({ where: { code: p.code }, defaults: p, ...txOpt });
    }

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
        ...txOpt,
      });
    }

    const assign = async (roleName, slugs) => {
      const role = await models.Role.findOne({ where: { name: roleName }, ...txOpt });
      if (!role) return;

      let abilities;
      if (slugs === '*') {
        abilities = await models.Ability.findAll(txOpt);
      } else {
        abilities = await models.Ability.findAll({ where: { code: slugs }, ...txOpt });
      }

      if (abilities.length) {
        await role.setAbilities(abilities, txOpt);
      }
    };

    await assign("SUPER_ADMIN", '*');

    await assign("QMS_DIRECTOR", [
      "dms.view", "dms.create", "dms.approve", "dms.manage",
      "nc.view", "nc.create", "nc.manage",
      "capa.view", "capa.create", "capa.manage", "capa.verify",
      "risk.read", "risk.create", "risk.update", "risk.assess", "risk.accept",
      "supplier.read", "supplier.manage",
      "training.read", "training.manage",
      "equipment.read", "equipment.calibrate",
      "review.read", "review.manage",
      "complaint.read", "complaint.create", "complaint.manage",
      "change.read", "change.create", "change.approve",
      "validation.read", "validation.manage",
      "product.read", "product.manage",
      "design.view", "design.create", "design.manage", "design.approve",
      "esign.view", "esign.sign", "esign.request", "esign.manage",
      "equipment.manage",
      "dhr.read", "dhr.create", "dhr.manage",
      "qms.audit.view", "qms.audit.verify", "qms.audit.report",
      "analytics.view", "audit.log.view",
      "warehouse.view", "rbac.manage", "users.manage",
      "admin.access",
    ]);

    await assign("QMS_ENGINEER", [
      "dms.view", "dms.create",
      "nc.view", "nc.create", "nc.manage",
      "capa.view", "capa.create",
      "risk.read", "risk.create", "risk.update", "risk.assess",
      "supplier.read",
      "training.read", "training.manage",
      "equipment.read", "equipment.calibrate", "equipment.manage",
      "complaint.read", "complaint.create",
      "change.read", "change.create",
      "validation.read", "validation.manage",
      "product.read",
      "review.read",
      "design.view", "design.create", "design.manage",
      "esign.view", "esign.sign", "esign.request",
      "dhr.read", "dhr.create",
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
      "equipment.read", "equipment.manage",
      "dhr.read", "dhr.create", "dhr.manage",
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
      "review.read", "complaint.read", "change.read",
      "validation.read", "product.read", "analytics.view",
      "design.view", "esign.view", "dhr.read",
    ]);

    await transaction.commit();
    console.log(">>> [RBAC] Инициализация завершена успешно.");
  } catch (e) {
    await transaction.rollback();
    console.error(">>> [RBAC] Ошибка инициализации:", e);
  }
};

const start = async () => {
  try {
    // Initialize license system (reads file/env, verifies Ed25519 signature)
    licenseService.init();
    licenseService.applyToModuleManager(moduleManager);

    moduleManager.printStatus();
    await sequelize.authenticate();
// AUTO-DISABLED: sequelize.sync disabled (use migrations)


    await initInitialData();
    startAuditRetentionScheduler();
    RiskMonitoringService.startScheduler();

    app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
  } catch (e) {
    console.log(e);
  }
};

start();
