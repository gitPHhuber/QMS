require("dotenv").config();
const express = require("express");
const sequelize = require("./db");
const models = require("./models/index");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const router = require("./routes/index");
const errorHandler = require("./middleware/ErrorHandlingMiddleware");
const path = require("path");


const beryllExtendedRouter = require("./routes/beryllExtendedRouter");

const { initChecklistTemplates } = require("./controllers/beryll");

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


app.use("/api/beryll", beryllExtendedRouter);


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


      { code: "assembly.execute", description: "Работа в сборочном терминале" },
      { code: "recipe.manage", description: "Создание и редактирование техкарт" },


      { code: "firmware.flash", description: "Прошивка плат (FC, ELRS, Coral)" },
      { code: "devices.view", description: "Просмотр списка устройств" },


      { code: "defect.manage", description: "Управление справочниками брака" },
      { code: "defect.report", description: "Фиксация брака" },


      { code: "analytics.view", description: "Просмотр дашбордов и рейтингов" },


      { code: "beryll.view", description: "Просмотр серверов АПК Берилл" },
      { code: "beryll.work", description: "Взятие в работу и настройка серверов" },
      { code: "beryll.manage", description: "Управление модулем (Синхронизация DHCP)" },
    ];


    for (const p of permissions) {
      await models.Ability.findOrCreate({ where: { code: p.code }, defaults: p });
    }


    const rolesData = {
      SUPER_ADMIN: "Полный доступ (DevOps/Admin)",
      PRODUCTION_CHIEF: "Нач. производства",
      TECHNOLOGIST: "Технолог",
      WAREHOUSE_MASTER: "Кладовщик",
      ASSEMBLER: "Сборщик",
      QC_ENGINEER: "Инженер ОТК",
      FIRMWARE_OPERATOR: "Прошивальщик"
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

    await assign("PRODUCTION_CHIEF", [
      "analytics.view", "users.manage", "defect.manage",
      "warehouse.view", "devices.view", "recipe.manage",
      "beryll.view"
    ]);

    await assign("TECHNOLOGIST", [
      "recipe.manage", "firmware.flash", "devices.view",
      "defect.manage",
      "beryll.view", "beryll.work", "beryll.manage"
    ]);

    await assign("WAREHOUSE_MASTER", [
      "warehouse.view", "warehouse.manage", "labels.print"
    ]);

    await assign("ASSEMBLER", [
      "assembly.execute"
    ]);

    await assign("QC_ENGINEER", [
      "defect.report", "devices.view", "warehouse.view"
    ]);

    await assign("FIRMWARE_OPERATOR", [
      "firmware.flash", "devices.view",
      "beryll.view", "beryll.work"
    ]);

    console.log(">>> [RBAC] Инициализация завершена успешно.");
  } catch (e) {
    console.error(">>> [RBAC] Ошибка инициализации:", e);
  }
};

const start = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });


    await initInitialData();


    console.log(">>> [Beryll] Инициализация шаблонов чек-листов...");
    await initChecklistTemplates();
    console.log(">>> [Beryll] Шаблоны чек-листов инициализированы");

    app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
  } catch (e) {
    console.log(e);
  }
};

start();
