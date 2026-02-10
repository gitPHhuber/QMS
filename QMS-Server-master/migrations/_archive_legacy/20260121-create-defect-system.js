'use strict';


module.exports = {
  async up(queryInterface, Sequelize) {


    await queryInterface.createTable('defect_categories', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      code: {
        type: Sequelize.STRING(50),
        unique: true,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      severity: {
        type: Sequelize.ENUM("CRITICAL", "MAJOR", "MINOR"),
        defaultValue: "MAJOR"
      },
      applicableTypes: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });


    await queryInterface.createTable('board_defects', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },


      boardType: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      boardId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      serialNumber: {
        type: Sequelize.STRING(100),
        allowNull: true
      },


      categoryId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'defect_categories', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },


      detectedById: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      detectedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },


      status: {
        type: Sequelize.ENUM(
          "OPEN", "IN_REPAIR", "REPAIRED", "VERIFIED",
          "SCRAPPED", "RETURNED", "CLOSED"
        ),
        defaultValue: "OPEN"
      },


      closedById: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      closedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      finalResult: {
        type: Sequelize.ENUM("FIXED", "SCRAPPED", "RETURNED_TO_SUPPLIER", "FALSE_POSITIVE"),
        allowNull: true
      },


      totalRepairMinutes: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },

      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });


    await queryInterface.addIndex('board_defects', ['boardType']);
    await queryInterface.addIndex('board_defects', ['boardType', 'boardId']);
    await queryInterface.addIndex('board_defects', ['status']);
    await queryInterface.addIndex('board_defects', ['categoryId']);
    await queryInterface.addIndex('board_defects', ['detectedById']);
    await queryInterface.addIndex('board_defects', ['detectedAt']);
    await queryInterface.addIndex('board_defects', ['serialNumber']);


    await queryInterface.createTable('repair_actions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },

      boardDefectId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'board_defects', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },

      actionType: {
        type: Sequelize.ENUM(
          "DIAGNOSIS", "SOLDER", "REPLACE", "FLASH",
          "TEST", "CLEAN", "CLONE_DISK", "CABLE_REPLACE", "OTHER"
        ),
        allowNull: false
      },

      performedById: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      performedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },

      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      timeSpentMinutes: {
        type: Sequelize.INTEGER,
        allowNull: true
      },

      result: {
        type: Sequelize.ENUM("SUCCESS", "PARTIAL", "FAILED", "PENDING"),
        defaultValue: "PENDING"
      },

      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });


    await queryInterface.addIndex('repair_actions', ['boardDefectId']);
    await queryInterface.addIndex('repair_actions', ['performedById']);
    await queryInterface.addIndex('repair_actions', ['performedAt']);


    const now = new Date();

    await queryInterface.bulkInsert('abilities', [
      { code: 'defect.create', description: 'Регистрация дефектов', createdAt: now, updatedAt: now },
      { code: 'defect.update', description: 'Обновление статуса дефектов', createdAt: now, updatedAt: now },
      { code: 'defect.repair', description: 'Выполнение ремонта', createdAt: now, updatedAt: now },
      { code: 'defect.scrap', description: 'Списание брака', createdAt: now, updatedAt: now },
      { code: 'defect.verify', description: 'Подтверждение ремонта (ОТК)', createdAt: now, updatedAt: now },
    ], { ignoreDuplicates: true });
  },

  async down(queryInterface, Sequelize) {

    await queryInterface.dropTable('repair_actions');
    await queryInterface.dropTable('board_defects');
    await queryInterface.dropTable('defect_categories');


    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_defect_categories_severity";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_board_defects_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_board_defects_finalResult";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_repair_actions_actionType";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_repair_actions_result";');


    await queryInterface.bulkDelete('abilities', {
      code: { [Sequelize.Op.in]: [
        'defect.create', 'defect.update', 'defect.repair',
        'defect.scrap', 'defect.verify'
      ]}
    });
  }
};
