"use strict";

/**
 * WMS ISO 13485 Compliance Migration
 *
 * Creates all new tables and alters existing ones for:
 * Phase 1: Storage zones, quarantine decisions, incoming inspections, DHR
 * Phase 2: Environment monitoring, storage locations, shipments, expiry alerts
 * Phase 3: Returns
 *
 * All new columns on existing tables are nullable for backward compatibility.
 * Uses idempotent checks (to_regclass) to safely re-run.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const has = async (name) => {
      const r = await queryInterface.sequelize.query(
        `SELECT to_regclass('public.${name}') AS t`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      return !!r?.[0]?.t;
    };

    const hasColumn = async (table, column) => {
      try {
        const desc = await queryInterface.describeTable(table);
        return !!desc[column];
      } catch {
        return false;
      }
    };

    // ═════════════════════════════════════════════════════════════
    // PHASE 1: STORAGE ZONES
    // ═════════════════════════════════════════════════════════════

    if (!(await has("storage_zones"))) {
      await queryInterface.createTable("storage_zones", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: Sequelize.STRING(255), allowNull: false },
        type: { type: Sequelize.STRING(50), allowNull: false },
        parentZoneId: { type: Sequelize.INTEGER, allowNull: true, references: { model: "storage_zones", key: "id" } },
        conditions: { type: Sequelize.JSONB, allowNull: true },
        capacity: { type: Sequelize.INTEGER, allowNull: true },
        isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      });
      console.log("  created storage_zones");

      // Seed default zones
      await queryInterface.bulkInsert("storage_zones", [
        { name: "Зона приёмки", type: "INCOMING", isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { name: "Карантинная зона", type: "QUARANTINE", isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { name: "Основной склад", type: "MAIN", isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { name: "Готовая продукция", type: "FINISHED_GOODS", isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { name: "Зона брака", type: "DEFECT", isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { name: "Зона отгрузки", type: "SHIPPING", isActive: true, createdAt: new Date(), updatedAt: new Date() },
      ]);
      console.log("  seeded default zones");
    }

    if (!(await has("zone_transition_rules"))) {
      await queryInterface.createTable("zone_transition_rules", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        fromZoneType: { type: Sequelize.STRING(50), allowNull: false },
        toZoneType: { type: Sequelize.STRING(50), allowNull: false },
        requiresApproval: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        requiredRole: { type: Sequelize.STRING(100), allowNull: true },
        isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      });
      console.log("  created zone_transition_rules");

      // Seed default transition matrix
      const rules = [
        // From INCOMING
        { fromZoneType: "INCOMING", toZoneType: "QUARANTINE", requiresApproval: false },
        { fromZoneType: "INCOMING", toZoneType: "MAIN", requiresApproval: false },
        { fromZoneType: "INCOMING", toZoneType: "DEFECT", requiresApproval: false },
        // From QUARANTINE
        { fromZoneType: "QUARANTINE", toZoneType: "MAIN", requiresApproval: true, requiredRole: "nc.manage" },
        { fromZoneType: "QUARANTINE", toZoneType: "DEFECT", requiresApproval: false },
        { fromZoneType: "QUARANTINE", toZoneType: "SHIPPING", requiresApproval: true, requiredRole: "nc.manage" },
        // From MAIN
        { fromZoneType: "MAIN", toZoneType: "FINISHED_GOODS", requiresApproval: false },
        { fromZoneType: "MAIN", toZoneType: "QUARANTINE", requiresApproval: false },
        { fromZoneType: "MAIN", toZoneType: "DEFECT", requiresApproval: false },
        { fromZoneType: "MAIN", toZoneType: "SHIPPING", requiresApproval: false },
        // From FINISHED_GOODS
        { fromZoneType: "FINISHED_GOODS", toZoneType: "SHIPPING", requiresApproval: false },
        { fromZoneType: "FINISHED_GOODS", toZoneType: "QUARANTINE", requiresApproval: false },
        { fromZoneType: "FINISHED_GOODS", toZoneType: "MAIN", requiresApproval: false },
        // From DEFECT
        { fromZoneType: "DEFECT", toZoneType: "MAIN", requiresApproval: true, requiredRole: "nc.manage" },
        { fromZoneType: "DEFECT", toZoneType: "SHIPPING", requiresApproval: true, requiredRole: "nc.manage" },
        // From SHIPPING
        { fromZoneType: "SHIPPING", toZoneType: "MAIN", requiresApproval: false },
        { fromZoneType: "SHIPPING", toZoneType: "QUARANTINE", requiresApproval: false },
      ];
      await queryInterface.bulkInsert(
        "zone_transition_rules",
        rules.map((r) => ({
          ...r,
          requiresApproval: r.requiresApproval || false,
          requiredRole: r.requiredRole || null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }))
      );
      console.log("  seeded zone transition rules");
    }

    // ALTER warehouse_boxes: add zone columns
    if (await has("warehouse_boxes")) {
      if (!(await hasColumn("warehouse_boxes", "currentZoneId"))) {
        await queryInterface.addColumn("warehouse_boxes", "currentZoneId", {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: "storage_zones", key: "id" },
        });
        // Map all existing boxes to MAIN zone
        const [mainZones] = await queryInterface.sequelize.query(
          `SELECT id FROM storage_zones WHERE type = 'MAIN' LIMIT 1`
        );
        if (mainZones.length > 0) {
          await queryInterface.sequelize.query(
            `UPDATE warehouse_boxes SET "currentZoneId" = ${mainZones[0].id} WHERE "currentZoneId" IS NULL`
          );
        }
        console.log("  added currentZoneId to warehouse_boxes and mapped to MAIN");
      }

      if (!(await hasColumn("warehouse_boxes", "expiryDate"))) {
        await queryInterface.addColumn("warehouse_boxes", "expiryDate", { type: Sequelize.DATEONLY, allowNull: true });
      }
      if (!(await hasColumn("warehouse_boxes", "manufacturingDate"))) {
        await queryInterface.addColumn("warehouse_boxes", "manufacturingDate", { type: Sequelize.DATEONLY, allowNull: true });
      }
      if (!(await hasColumn("warehouse_boxes", "shelfLifeMonths"))) {
        await queryInterface.addColumn("warehouse_boxes", "shelfLifeMonths", { type: Sequelize.INTEGER, allowNull: true });
      }
      if (!(await hasColumn("warehouse_boxes", "storageLocationId"))) {
        await queryInterface.addColumn("warehouse_boxes", "storageLocationId", {
          type: Sequelize.INTEGER,
          allowNull: true,
        });
      }
      console.log("  added ISO columns to warehouse_boxes");
    }

    // ALTER warehouse_movements: add zone tracking
    if (await has("warehouse_movements")) {
      if (!(await hasColumn("warehouse_movements", "fromZoneId"))) {
        await queryInterface.addColumn("warehouse_movements", "fromZoneId", { type: Sequelize.INTEGER, allowNull: true });
      }
      if (!(await hasColumn("warehouse_movements", "toZoneId"))) {
        await queryInterface.addColumn("warehouse_movements", "toZoneId", { type: Sequelize.INTEGER, allowNull: true });
      }
      console.log("  added zone tracking to warehouse_movements");
    }

    // ═════════════════════════════════════════════════════════════
    // PHASE 1: QUARANTINE DECISIONS
    // ═════════════════════════════════════════════════════════════

    if (!(await has("quarantine_decisions"))) {
      await queryInterface.createTable("quarantine_decisions", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        boxId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "warehouse_boxes", key: "id" } },
        reason: { type: Sequelize.TEXT, allowNull: false },
        decisionType: { type: Sequelize.STRING(50), allowNull: false },
        decidedById: { type: Sequelize.INTEGER, allowNull: false, references: { model: "users", key: "id" } },
        decidedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        ncId: { type: Sequelize.INTEGER, allowNull: true },
        notes: { type: Sequelize.TEXT, allowNull: true },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      });
      console.log("  created quarantine_decisions");
    }

    // ═════════════════════════════════════════════════════════════
    // PHASE 1: INCOMING INSPECTIONS
    // ═════════════════════════════════════════════════════════════

    if (!(await has("incoming_inspections"))) {
      await queryInterface.createTable("incoming_inspections", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        supplyId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "supplies", key: "id" } },
        inspectorId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "users", key: "id" } },
        date: { type: Sequelize.DATEONLY, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        status: { type: Sequelize.STRING(50), allowNull: false, defaultValue: "PENDING" },
        overallResult: { type: Sequelize.TEXT, allowNull: true },
        notes: { type: Sequelize.TEXT, allowNull: true },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      });
      console.log("  created incoming_inspections");
    }

    if (!(await has("inspection_checklist_items"))) {
      await queryInterface.createTable("inspection_checklist_items", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        inspectionId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "incoming_inspections", key: "id" } },
        checkItem: { type: Sequelize.STRING(500), allowNull: false },
        result: { type: Sequelize.STRING(50), allowNull: true },
        value: { type: Sequelize.STRING(255), allowNull: true },
        comment: { type: Sequelize.TEXT, allowNull: true },
        photoUrl: { type: Sequelize.STRING(1000), allowNull: true },
        sortOrder: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      });
      console.log("  created inspection_checklist_items");
    }

    if (!(await has("inspection_templates"))) {
      await queryInterface.createTable("inspection_templates", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: Sequelize.STRING(255), allowNull: false },
        productType: { type: Sequelize.STRING(100), allowNull: true },
        items: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
        isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      });

      // Seed default inspection templates
      await queryInterface.bulkInsert("inspection_templates", [
        {
          name: "Стандартный входной контроль",
          productType: null,
          items: JSON.stringify([
            { checkItem: "Состояние упаковки", description: "Визуальный осмотр целостности упаковки", required: true },
            { checkItem: "Комплектность", description: "Соответствие содержимого накладной", required: true },
            { checkItem: "Документы качества", description: "Наличие сертификатов, паспортов", required: true },
            { checkItem: "Маркировка", description: "Читаемость, соответствие", required: true },
            { checkItem: "Внешний вид", description: "Отсутствие повреждений, коррозии", required: true },
            { checkItem: "Геометрические параметры", description: "Соответствие чертежу (выборочно)", required: false },
            { checkItem: "Масса", description: "Соответствие нормативу (если применимо)", required: false },
          ]),
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Входной контроль электронных компонентов",
          productType: "COMPONENT",
          items: JSON.stringify([
            { checkItem: "Состояние упаковки", description: "Антистатическая упаковка", required: true },
            { checkItem: "Маркировка", description: "Партия, дата, производитель", required: true },
            { checkItem: "Документы качества", description: "Сертификат, datasheet", required: true },
            { checkItem: "Количество", description: "Соответствие заказу", required: true },
            { checkItem: "Срок годности", description: "Проверка date code", required: true },
            { checkItem: "Визуальный осмотр", description: "Отсутствие окисления выводов", required: true },
          ]),
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      console.log("  created inspection_templates with defaults");
    }

    // ═════════════════════════════════════════════════════════════
    // PHASE 1: DEVICE HISTORY RECORDS (DHR)
    // ═════════════════════════════════════════════════════════════

    if (!(await has("device_history_records"))) {
      await queryInterface.createTable("device_history_records", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        productId: { type: Sequelize.INTEGER, allowNull: true },
        serialNumber: { type: Sequelize.STRING(255), allowNull: false, unique: true },
        batchNumber: { type: Sequelize.STRING(255), allowNull: true },
        status: { type: Sequelize.STRING(50), allowNull: false, defaultValue: "IN_PRODUCTION" },
        manufacturingDate: { type: Sequelize.DATEONLY, allowNull: true },
        releaseDate: { type: Sequelize.DATEONLY, allowNull: true },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      });
      console.log("  created device_history_records");
    }

    if (!(await has("dhr_components"))) {
      await queryInterface.createTable("dhr_components", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        dhrId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "device_history_records", key: "id" } },
        boxId: { type: Sequelize.INTEGER, allowNull: true },
        componentName: { type: Sequelize.STRING(255), allowNull: false },
        quantity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        supplierLot: { type: Sequelize.STRING(255), allowNull: true },
        certificateRef: { type: Sequelize.STRING(500), allowNull: true },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      });
      console.log("  created dhr_components");
    }

    if (!(await has("dhr_records"))) {
      await queryInterface.createTable("dhr_records", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        dhrId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "device_history_records", key: "id" } },
        recordType: { type: Sequelize.STRING(50), allowNull: false },
        referenceId: { type: Sequelize.INTEGER, allowNull: true },
        description: { type: Sequelize.TEXT, allowNull: true },
        recordedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        recordedById: { type: Sequelize.INTEGER, allowNull: true },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      });
      console.log("  created dhr_records");
    }

    // ═════════════════════════════════════════════════════════════
    // PHASE 2: ENVIRONMENT MONITORING
    // ═════════════════════════════════════════════════════════════

    if (!(await has("environment_readings"))) {
      await queryInterface.createTable("environment_readings", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        zoneId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "storage_zones", key: "id" } },
        temperature: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
        humidity: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
        measuredAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        measuredById: { type: Sequelize.INTEGER, allowNull: false, references: { model: "users", key: "id" } },
        equipmentId: { type: Sequelize.INTEGER, allowNull: true },
        isWithinLimits: { type: Sequelize.BOOLEAN, allowNull: true },
        notes: { type: Sequelize.TEXT, allowNull: true },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      });
      console.log("  created environment_readings");
    }

    if (!(await has("environment_alerts"))) {
      await queryInterface.createTable("environment_alerts", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        zoneId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "storage_zones", key: "id" } },
        readingId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "environment_readings", key: "id" } },
        alertType: { type: Sequelize.STRING(50), allowNull: false },
        acknowledgedById: { type: Sequelize.INTEGER, allowNull: true },
        acknowledgedAt: { type: Sequelize.DATE, allowNull: true },
        actionTaken: { type: Sequelize.TEXT, allowNull: true },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      });
      console.log("  created environment_alerts");
    }

    // ═════════════════════════════════════════════════════════════
    // PHASE 2: EXPIRY ALERTS
    // ═════════════════════════════════════════════════════════════

    if (!(await has("expiry_alerts"))) {
      await queryInterface.createTable("expiry_alerts", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        boxId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "warehouse_boxes", key: "id" } },
        alertDays: { type: Sequelize.INTEGER, allowNull: false },
        notifiedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        acknowledged: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      });
      console.log("  created expiry_alerts");
    }

    // ═════════════════════════════════════════════════════════════
    // PHASE 2: STORAGE LOCATIONS (ADDRESS STORAGE)
    // ═════════════════════════════════════════════════════════════

    if (!(await has("storage_locations"))) {
      await queryInterface.createTable("storage_locations", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        zoneId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "storage_zones", key: "id" } },
        rack: { type: Sequelize.STRING(50), allowNull: false },
        shelf: { type: Sequelize.STRING(50), allowNull: false },
        cell: { type: Sequelize.STRING(50), allowNull: true },
        barcode: { type: Sequelize.STRING(100), allowNull: false, unique: true },
        capacity: { type: Sequelize.INTEGER, allowNull: true },
        isOccupied: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      });
      console.log("  created storage_locations");
    }

    // ═════════════════════════════════════════════════════════════
    // PHASE 2: SHIPMENTS
    // ═════════════════════════════════════════════════════════════

    if (!(await has("shipments"))) {
      await queryInterface.createTable("shipments", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        number: { type: Sequelize.STRING(100), allowNull: false },
        date: { type: Sequelize.DATEONLY, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        customerId: { type: Sequelize.INTEGER, allowNull: true },
        contractNumber: { type: Sequelize.STRING(255), allowNull: true },
        status: { type: Sequelize.STRING(50), allowNull: false, defaultValue: "DRAFT" },
        shippedById: { type: Sequelize.INTEGER, allowNull: true },
        verifiedById: { type: Sequelize.INTEGER, allowNull: true },
        notes: { type: Sequelize.TEXT, allowNull: true },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      });
      console.log("  created shipments");
    }

    if (!(await has("shipment_items"))) {
      await queryInterface.createTable("shipment_items", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        shipmentId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "shipments", key: "id" } },
        boxId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "warehouse_boxes", key: "id" } },
        quantity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        packageCondition: { type: Sequelize.STRING(50), allowNull: true },
        verifiedAt: { type: Sequelize.DATE, allowNull: true },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      });
      console.log("  created shipment_items");
    }

    // ═════════════════════════════════════════════════════════════
    // PHASE 3: RETURNS
    // ═════════════════════════════════════════════════════════════

    if (!(await has("returns"))) {
      await queryInterface.createTable("returns", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        number: { type: Sequelize.STRING(100), allowNull: false },
        date: { type: Sequelize.DATEONLY, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        customerId: { type: Sequelize.INTEGER, allowNull: true },
        shipmentId: { type: Sequelize.INTEGER, allowNull: true },
        reason: { type: Sequelize.TEXT, allowNull: true },
        status: { type: Sequelize.STRING(50), allowNull: false, defaultValue: "RECEIVED" },
        complaintId: { type: Sequelize.INTEGER, allowNull: true },
        notes: { type: Sequelize.TEXT, allowNull: true },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      });
      console.log("  created returns");
    }

    if (!(await has("return_items"))) {
      await queryInterface.createTable("return_items", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        returnId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "returns", key: "id" } },
        boxId: { type: Sequelize.INTEGER, allowNull: true },
        serialNumber: { type: Sequelize.STRING(255), allowNull: true },
        quantity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        condition: { type: Sequelize.TEXT, allowNull: true },
        disposition: { type: Sequelize.STRING(50), allowNull: true },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      });
      console.log("  created return_items");
    }

    // ═════════════════════════════════════════════════════════════
    // INDEXES
    // ═════════════════════════════════════════════════════════════

    try {
      await queryInterface.addIndex("device_history_records", ["serialNumber"], { unique: true, name: "idx_dhr_serial" });
      await queryInterface.addIndex("device_history_records", ["batchNumber"], { name: "idx_dhr_batch" });
      await queryInterface.addIndex("dhr_components", ["dhrId"], { name: "idx_dhr_comp_dhr" });
      await queryInterface.addIndex("dhr_components", ["boxId"], { name: "idx_dhr_comp_box" });
      await queryInterface.addIndex("dhr_records", ["dhrId"], { name: "idx_dhr_rec_dhr" });
      await queryInterface.addIndex("warehouse_boxes", ["currentZoneId"], { name: "idx_wb_zone" });
      await queryInterface.addIndex("warehouse_boxes", ["expiryDate"], { name: "idx_wb_expiry" });
      await queryInterface.addIndex("environment_readings", ["zoneId", "measuredAt"], { name: "idx_env_zone_date" });
      await queryInterface.addIndex("storage_locations", ["zoneId"], { name: "idx_loc_zone" });
      console.log("  created indexes");
    } catch (e) {
      console.warn("  some indexes may already exist:", e.message);
    }

    console.log("✅ [wms-iso-compliance] All WMS ISO 13485 tables created");
  },

  async down(queryInterface) {
    const tables = [
      "return_items", "returns",
      "shipment_items", "shipments",
      "storage_locations",
      "expiry_alerts",
      "environment_alerts", "environment_readings",
      "dhr_records", "dhr_components", "device_history_records",
      "inspection_checklist_items", "incoming_inspections", "inspection_templates",
      "quarantine_decisions",
      "zone_transition_rules", "storage_zones",
    ];
    for (const t of tables) {
      await queryInterface.dropTable(t, { cascade: true }).catch(() => {});
    }

    // Remove added columns
    try {
      await queryInterface.removeColumn("warehouse_boxes", "currentZoneId");
      await queryInterface.removeColumn("warehouse_boxes", "expiryDate");
      await queryInterface.removeColumn("warehouse_boxes", "manufacturingDate");
      await queryInterface.removeColumn("warehouse_boxes", "shelfLifeMonths");
      await queryInterface.removeColumn("warehouse_boxes", "storageLocationId");
      await queryInterface.removeColumn("warehouse_movements", "fromZoneId");
      await queryInterface.removeColumn("warehouse_movements", "toZoneId");
    } catch {}
  },
};
