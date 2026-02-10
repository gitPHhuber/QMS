require("dotenv").config();
const express = require("express");
const sequelize = require("./db");
const models = require("./models/index");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const router = require("./routes/index");
const errorHandler = require("./middleware/ErrorHandlingMiddleware");
const path = require("path");

const PORT = process.env.PORT || 5000;
const app = express();

app.use(express.json());

const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.static(path.resolve(__dirname, "static")));
app.use(fileUpload({}));


app.use("/api", router);


app.use(errorHandler);

const initInitialData = async () => {
  try {
    console.log(">>> [RBAC] Начинаем инициализацию ролей и прав...");


    const permissions = [

      { code: "rbac.manage", description: "Управление ролями и матрицей прав" },
      { code: "users.manage", description: "Назначение ролей пользователям" },


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
    ];


    for (const p of permissions) {
      await models.Ability.findOrCreate({ where: { code: p.code }, defaults: p });
    }


    const rolesData = {
      SUPER_ADMIN: "Полный доступ (DevOps/Admin)",
      QC_ENGINEER: "Инженер ОТК",
      WAREHOUSE_MASTER: "Кладовщик",
    };

    for (const [name, desc] of Object.entries(rolesData)) {
      await models.Role.findOrCreate({
        where: { name },
        defaults: { description: desc }
      });
    }


    const assign = async (roleName, slugs) => {
      const role = await models.Role.findOne({ where: { name: roleName } });
      if (!role) return;

      let abilities;
      if (slugs === '*') {

        abilities = await models.Ability.findAll();
      } else {
        abilities = await models.Ability.findAll({ where: { code: slugs } });
      }

      if (abilities.length) {
        await role.setAbilities(abilities);
      }
    };


    await assign("SUPER_ADMIN", '*');

    await assign("WAREHOUSE_MASTER", [
      "warehouse.view", "warehouse.manage", "labels.print"
    ]);

    await assign("QC_ENGINEER", [
      "warehouse.view",
      "nc.view", "nc.create", "nc.manage",
      "capa.view", "capa.create", "capa.manage", "capa.verify",
      "qms.audit.view",
    ]);

    console.log(">>> [RBAC] Инициализация завершена успешно.");
  } catch (e) {
    console.error(">>> [RBAC] Ошибка инициализации:", e);
  }
};

const start = async () => {
  try {
    await sequelize.authenticate();
// AUTO-DISABLED: sequelize.sync disabled (use migrations)


    await initInitialData();

    app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
  } catch (e) {
    console.log(e);
  }
};

start();
