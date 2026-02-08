

require('dotenv').config();

const { Sequelize, DataTypes, Op } = require("sequelize");


const sequelize = new Sequelize(
    process.env.DB_NAME || 'flight_controller_database',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || '',
    {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false
    }
);


const User = sequelize.define("user", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING },
    surname: { type: DataTypes.STRING },
}, {
    tableName: "users",
    timestamps: false
});

const OperationType = sequelize.define("operation_type", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    code: { type: DataTypes.STRING(50), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    unit: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'шт' },
    normMinutes: { type: DataTypes.FLOAT, allowNull: true },
    sectionId: { type: DataTypes.INTEGER, allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    sortOrder: { type: DataTypes.INTEGER, defaultValue: 0 }
}, {
    tableName: "operation_types",
    timestamps: true
});

const ProductionOutput = sequelize.define("production_output", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    teamId: { type: DataTypes.INTEGER, allowNull: true },
    sectionId: { type: DataTypes.INTEGER, allowNull: true },
    projectId: { type: DataTypes.INTEGER, allowNull: true },
    taskId: { type: DataTypes.INTEGER, allowNull: true },
    operationTypeId: { type: DataTypes.INTEGER, allowNull: true },
    claimedQty: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    approvedQty: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    rejectedQty: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'approved' },
    approvedById: { type: DataTypes.INTEGER, allowNull: true },
    approvedAt: { type: DataTypes.DATE, allowNull: true },
    createdById: { type: DataTypes.INTEGER, allowNull: true },
    comment: { type: DataTypes.TEXT, allowNull: true },
    rejectReason: { type: DataTypes.TEXT, allowNull: true }
}, {
    tableName: "production_outputs",
    timestamps: true
});


const OPERATION_TYPES = {
    THERMAL_CALIBRATION: {
        name: "Тепловизор калибровка",
        code: "THERMAL_CALIBRATION",
        description: "Калибровка и фокусировка тепловизоров",
        unit: "шт"
    },
    THERMAL_DEFECT_CHECK: {
        name: "Тепловизор отбраковка",
        code: "THERMAL_DEFECT_CHECK",
        description: "Отбор брака тепловизоров",
        unit: "шт"
    },
    THERMAL_FIRMWARE: {
        name: "Тепловизор прошивка",
        code: "THERMAL_FIRMWARE",
        description: "Перепрошивка тепловизоров на 94-ю прошивку",
        unit: "шт"
    },
    THERMAL_RESTORE: {
        name: "Тепловизор восстановление",
        code: "THERMAL_RESTORE",
        description: "Восстановление тепловизоров",
        unit: "шт"
    }
};


const IMPORT_DATA = [

  {"employee": "Гекман Кирилл", "date": "2026-01-12", "quantity": 120, "operation": "THERMAL_CALIBRATION", "month_name": "Январь 2026"},
  {"employee": "Гекман Кирилл", "date": "2026-01-13", "quantity": 100, "operation": "THERMAL_CALIBRATION", "month_name": "Январь 2026"},
  {"employee": "Гекман Кирилл", "date": "2026-01-14", "quantity": 100, "operation": "THERMAL_CALIBRATION", "month_name": "Январь 2026"},
  {"employee": "Гекман Кирилл", "date": "2026-01-15", "quantity": 120, "operation": "THERMAL_CALIBRATION", "month_name": "Январь 2026"},
  {"employee": "Гекман Кирилл", "date": "2026-01-16", "quantity": 100, "operation": "THERMAL_CALIBRATION", "month_name": "Январь 2026"},
  {"employee": "Гекман Кирилл", "date": "2026-01-19", "quantity": 100, "operation": "THERMAL_CALIBRATION", "month_name": "Январь 2026"},
  {"employee": "Гекман Кирилл", "date": "2026-01-20", "quantity": 60, "operation": "THERMAL_CALIBRATION", "month_name": "Январь 2026"},
  {"employee": "Гекман Кирилл", "date": "2026-01-21", "quantity": 20, "operation": "THERMAL_CALIBRATION", "month_name": "Январь 2026"},
  {"employee": "Дмитроченко Артур", "date": "2026-01-12", "quantity": 40, "operation": "THERMAL_CALIBRATION", "month_name": "Январь 2026"},
  {"employee": "Дмитроченко Артур", "date": "2026-01-13", "quantity": 80, "operation": "THERMAL_CALIBRATION", "month_name": "Январь 2026"},
  {"employee": "Дмитроченко Артур", "date": "2026-01-14", "quantity": 60, "operation": "THERMAL_CALIBRATION", "month_name": "Январь 2026"},
  {"employee": "Дмитроченко Артур", "date": "2026-01-15", "quantity": 60, "operation": "THERMAL_CALIBRATION", "month_name": "Январь 2026"},
  {"employee": "Дмитроченко Артур", "date": "2026-01-16", "quantity": 60, "operation": "THERMAL_CALIBRATION", "month_name": "Январь 2026"},
  {"employee": "Дмитроченко Артур", "date": "2026-01-19", "quantity": 80, "operation": "THERMAL_CALIBRATION", "month_name": "Январь 2026"},
  {"employee": "Дмитроченко Артур", "date": "2026-01-21", "quantity": 170, "operation": "THERMAL_CALIBRATION", "month_name": "Январь 2026"},
  {"employee": "Зеленов Дмитрий", "date": "2026-01-12", "quantity": 60, "operation": "THERMAL_CALIBRATION", "month_name": "Январь 2026"},
  {"employee": "Зеленов Дмитрий", "date": "2026-01-13", "quantity": 60, "operation": "THERMAL_CALIBRATION", "month_name": "Январь 2026"},
  {"employee": "Зеленов Дмитрий", "date": "2026-01-14", "quantity": 40, "operation": "THERMAL_CALIBRATION", "month_name": "Январь 2026"},
  {"employee": "Зеленов Дмитрий", "date": "2026-01-15", "quantity": 80, "operation": "THERMAL_CALIBRATION", "month_name": "Январь 2026"},
  {"employee": "Зеленов Дмитрий", "date": "2026-01-16", "quantity": 40, "operation": "THERMAL_CALIBRATION", "month_name": "Январь 2026"},
  {"employee": "Зеленов Дмитрий", "date": "2026-01-19", "quantity": 90, "operation": "THERMAL_CALIBRATION", "month_name": "Январь 2026"},
  {"employee": "Зеленов Дмитрий", "date": "2026-01-21", "quantity": 60, "operation": "THERMAL_CALIBRATION", "month_name": "Январь 2026"},
  {"employee": "Латыш Николай", "date": "2026-01-13", "quantity": 36, "operation": "THERMAL_CALIBRATION", "month_name": "Январь 2026"},
  {"employee": "Латыш Николай", "date": "2026-01-14", "quantity": 20, "operation": "THERMAL_CALIBRATION", "month_name": "Январь 2026"},
  {"employee": "Латыш Николай", "date": "2026-01-15", "quantity": 80, "operation": "THERMAL_CALIBRATION", "month_name": "Январь 2026"},
  {"employee": "Латыш Николай", "date": "2026-01-16", "quantity": 80, "operation": "THERMAL_CALIBRATION", "month_name": "Январь 2026"},
  {"employee": "Латыш Николай", "date": "2026-01-19", "quantity": 40, "operation": "THERMAL_CALIBRATION", "month_name": "Январь 2026"},
  {"employee": "Латыш Николай", "date": "2026-01-20", "quantity": 40, "operation": "THERMAL_CALIBRATION", "month_name": "Январь 2026"},
  {"employee": "Ушаков Святослав", "date": "2026-01-14", "quantity": 60, "operation": "THERMAL_CALIBRATION", "month_name": "Январь 2026"},
  {"employee": "Ушаков Святослав", "date": "2026-01-15", "quantity": 100, "operation": "THERMAL_CALIBRATION", "month_name": "Январь 2026"},
  {"employee": "Ушаков Святослав", "date": "2026-01-19", "quantity": 100, "operation": "THERMAL_CALIBRATION", "month_name": "Январь 2026"},
  {"employee": "Ушаков Святослав", "date": "2026-01-20", "quantity": 100, "operation": "THERMAL_CALIBRATION", "month_name": "Январь 2026"},
  {"employee": "Ушаков Святослав", "date": "2026-01-21", "quantity": 20, "operation": "THERMAL_CALIBRATION", "month_name": "Январь 2026"},

  {"employee": "Латыш Николай", "date": "2026-01-22", "quantity": 10, "operation": "THERMAL_FIRMWARE", "month_name": "Январь 2026"},

  {"employee": "Ушаков Святослав", "date": "2026-01-22", "quantity": 20, "operation": "THERMAL_RESTORE", "month_name": "Январь 2026"}
];


const NAME_VARIANTS = {
  "Гекман Кирилл": ["Гекман", "Кирилл"],
  "Дмитроченко Артур": ["Дмитроченко", "Артур"],
  "Зеленов Дмитрий": ["Зеленов", "Дмитрий"],
  "Латыш Николай": ["Латыш", "Николай"],
  "Свистунов Сергей": ["Свистунов", "Сергей"],
  "Ушаков Святослав": ["Ушаков", "Святослав"],
};


async function findOrCreateOperationTypes() {
    const opTypeIds = {};

    for (const [code, data] of Object.entries(OPERATION_TYPES)) {
        let opType = await OperationType.findOne({
            where: { code }
        });

        if (!opType) {
            opType = await OperationType.create({
                name: data.name,
                code: data.code,
                description: data.description,
                unit: data.unit,
                isActive: true
            });
            console.log(`✅ Создан тип операции: ${opType.name} (ID: ${opType.id})`);
        } else {
            console.log(`ℹ️  Тип операции существует: ${opType.name} (ID: ${opType.id})`);
        }

        opTypeIds[code] = opType.id;
    }

    return opTypeIds;
}

async function findUserByName(fullName) {
    const variants = NAME_VARIANTS[fullName];
    if (!variants) {
        return null;
    }

    const [surname, name] = variants;


    let user = await User.findOne({
        where: { surname, name }
    });

    if (!user) {

        user = await User.findOne({
            where: {
                [Op.and]: [
                    sequelize.where(
                        sequelize.fn('LOWER', sequelize.col('surname')),
                        surname.toLowerCase()
                    ),
                    sequelize.where(
                        sequelize.fn('LOWER', sequelize.col('name')),
                        name.toLowerCase()
                    )
                ]
            }
        });
    }

    return user;
}

async function importData() {
    try {

        await sequelize.authenticate();
        console.log("📦 Подключение к БД установлено");
        console.log(`   База: ${process.env.DB_NAME || 'flight_controller_database'}`);
        console.log(`   Хост: ${process.env.DB_HOST || 'localhost'}\n`);


        const operationTypeIds = await findOrCreateOperationTypes();


        const stats = {
            total: IMPORT_DATA.length,
            success: 0,
            skipped: 0,
            userNotFound: [],
            duplicates: 0,
            byOperation: {}
        };


        const userCache = new Map();

        console.log("\n🔄 Начинаем импорт...\n");

        for (const record of IMPORT_DATA) {
            const { employee, date, quantity, operation } = record;


            const operationTypeId = operationTypeIds[operation];
            if (!operationTypeId) {
                console.log(`⚠️  Неизвестная операция: ${operation}`);
                stats.skipped++;
                continue;
            }


            let userId = userCache.get(employee);

            if (userId === undefined) {
                const user = await findUserByName(employee);
                if (user) {
                    userId = user.id;
                    userCache.set(employee, userId);
                    console.log(`👤 Найден: ${employee} -> ID ${userId}`);
                } else {
                    userCache.set(employee, null);
                    if (!stats.userNotFound.includes(employee)) {
                        stats.userNotFound.push(employee);
                        console.log(`❌ Не найден: ${employee}`);
                    }
                }
            }

            if (!userId) {
                stats.skipped++;
                continue;
            }


            const existing = await ProductionOutput.findOne({
                where: {
                    userId,
                    date,
                    operationTypeId,
                    claimedQty: quantity
                }
            });

            if (existing) {
                stats.duplicates++;
                continue;
            }


            await ProductionOutput.create({
                date,
                userId,
                operationTypeId,
                claimedQty: quantity,
                approvedQty: quantity,
                status: 'approved',
                comment: `Импорт из Excel - Тепловизоры (${record.month_name})`
            });

            stats.success++;
            stats.byOperation[operation] = (stats.byOperation[operation] || 0) + quantity;
        }


        console.log("\n" + "=".repeat(50));
        console.log("📊 РЕЗУЛЬТАТЫ ИМПОРТА:");
        console.log("=".repeat(50));
        console.log(`✅ Успешно импортировано: ${stats.success}`);
        console.log(`⏭️  Пропущено: ${stats.skipped}`);
        console.log(`🔄 Дубликаты: ${stats.duplicates}`);

        console.log(`\n📈 По операциям:`);
        for (const [op, total] of Object.entries(stats.byOperation)) {
            const opName = OPERATION_TYPES[op]?.name || op;
            console.log(`   ${opName}: ${total} шт`);
        }

        if (stats.userNotFound.length > 0) {
            console.log(`\n⚠️  Не найдены пользователи (${stats.userNotFound.length}):`);
            stats.userNotFound.forEach(name => console.log(`   - ${name}`));
        }

        console.log("\n✨ Импорт завершён!");

    } catch (error) {
        console.error("❌ Ошибка импорта:", error);
    } finally {
        await sequelize.close();
    }
}


importData();
