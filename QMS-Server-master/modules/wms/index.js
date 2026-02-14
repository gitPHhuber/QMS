module.exports = {
  code: 'wms.warehouse',

  register(router) {
    router.use('/warehouse', require('./routes/warehouseRouter'));
  },

  getModels() {
    const base = require('./models/Warehouse');
    const { StorageZone, ZoneTransitionRule } = require('./models/StorageZone');
    const { QuarantineDecision } = require('./models/QuarantineDecision');
    const { IncomingInspection, InspectionChecklistItem, InspectionTemplate } = require('./models/IncomingInspection');
    const { DeviceHistoryRecord, DHRComponent, DHRRecord } = require('./models/DeviceHistoryRecord');
    const { EnvironmentReading, EnvironmentAlert } = require('./models/EnvironmentMonitoring');
    const { StorageLocation } = require('./models/StorageLocation');
    const { Shipment, ShipmentItem } = require('./models/Shipment');
    const { Return, ReturnItem } = require('./models/Return');

    return {
      ...base,
      StorageZone,
      ZoneTransitionRule,
      QuarantineDecision,
      IncomingInspection,
      InspectionChecklistItem,
      InspectionTemplate,
      DeviceHistoryRecord,
      DHRComponent,
      DHRRecord,
      EnvironmentReading,
      EnvironmentAlert,
      StorageLocation,
      Shipment,
      ShipmentItem,
      Return,
      ReturnItem,
    };
  },

  setupAssociations(m) {
    // ── Existing associations ──

    // Supply <-> Box
    m.Supply.hasMany(m.WarehouseBox, { foreignKey: 'supplyId', as: 'boxes' });
    m.WarehouseBox.belongsTo(m.Supply, { foreignKey: 'supplyId', as: 'supply' });

    // Box <-> User
    m.User.hasMany(m.WarehouseBox, { foreignKey: 'acceptedById', as: 'acceptedBoxes' });
    m.WarehouseBox.belongsTo(m.User, { foreignKey: 'acceptedById', as: 'acceptedBy' });

    // Box <-> Section
    m.WarehouseBox.belongsTo(m.Section, { foreignKey: 'currentSectionId', as: 'currentSection' });
    m.Section.hasMany(m.WarehouseBox, { foreignKey: 'currentSectionId', as: 'boxes' });

    // Box <-> Movement
    m.WarehouseBox.hasMany(m.WarehouseMovement, { foreignKey: 'boxId', as: 'movements' });
    m.WarehouseMovement.belongsTo(m.WarehouseBox, { foreignKey: 'boxId', as: 'box' });

    // Movement <-> User / Section
    m.WarehouseMovement.belongsTo(m.User, { foreignKey: 'performedById', as: 'performedBy' });
    m.WarehouseMovement.belongsTo(m.Section, { foreignKey: 'fromSectionId', as: 'fromSection' });
    m.WarehouseMovement.belongsTo(m.Section, { foreignKey: 'toSectionId', as: 'toSection' });

    // ProductionTask (lives in Warehouse model file)
    if (m.ProductionTask) {
      m.ProductionTask.belongsTo(m.User, { foreignKey: 'responsibleId', as: 'responsible' });
      m.ProductionTask.belongsTo(m.User, { foreignKey: 'createdById', as: 'createdBy' });
      if (m.Project) {
        m.ProductionTask.belongsTo(m.Project, { foreignKey: 'projectId', as: 'project' });
        m.Project.hasMany(m.ProductionTask, { foreignKey: 'projectId', as: 'tasks' });
      }
    }

    // ── ISO 13485 New associations ──

    // StorageZone <-> WarehouseBox
    m.WarehouseBox.belongsTo(m.StorageZone, { foreignKey: 'currentZoneId', as: 'currentZone' });
    m.StorageZone.hasMany(m.WarehouseBox, { foreignKey: 'currentZoneId', as: 'boxes' });

    // StorageZone self-referencing (parent zone)
    m.StorageZone.belongsTo(m.StorageZone, { foreignKey: 'parentZoneId', as: 'parentZone' });
    m.StorageZone.hasMany(m.StorageZone, { foreignKey: 'parentZoneId', as: 'childZones' });

    // Movement <-> StorageZone
    m.WarehouseMovement.belongsTo(m.StorageZone, { foreignKey: 'fromZoneId', as: 'fromZone' });
    m.WarehouseMovement.belongsTo(m.StorageZone, { foreignKey: 'toZoneId', as: 'toZone' });

    // QuarantineDecision <-> WarehouseBox, User
    m.QuarantineDecision.belongsTo(m.WarehouseBox, { foreignKey: 'boxId', as: 'box' });
    m.QuarantineDecision.belongsTo(m.User, { foreignKey: 'decidedById', as: 'decidedBy' });
    m.WarehouseBox.hasMany(m.QuarantineDecision, { foreignKey: 'boxId', as: 'quarantineDecisions' });

    // IncomingInspection <-> Supply, User, ChecklistItems
    m.IncomingInspection.belongsTo(m.Supply, { foreignKey: 'supplyId', as: 'supply' });
    m.IncomingInspection.belongsTo(m.User, { foreignKey: 'inspectorId', as: 'inspector' });
    m.IncomingInspection.hasMany(m.InspectionChecklistItem, { foreignKey: 'inspectionId', as: 'checklistItems' });
    m.InspectionChecklistItem.belongsTo(m.IncomingInspection, { foreignKey: 'inspectionId', as: 'inspection' });
    m.Supply.hasMany(m.IncomingInspection, { foreignKey: 'supplyId', as: 'inspections' });

    // DeviceHistoryRecord <-> DHRComponent, DHRRecord
    m.DeviceHistoryRecord.hasMany(m.DHRComponent, { foreignKey: 'dhrId', as: 'components' });
    m.DHRComponent.belongsTo(m.DeviceHistoryRecord, { foreignKey: 'dhrId', as: 'dhr' });
    m.DHRComponent.belongsTo(m.WarehouseBox, { foreignKey: 'boxId', as: 'box' });
    m.DeviceHistoryRecord.hasMany(m.DHRRecord, { foreignKey: 'dhrId', as: 'records' });
    m.DHRRecord.belongsTo(m.DeviceHistoryRecord, { foreignKey: 'dhrId', as: 'dhr' });
    m.DHRRecord.belongsTo(m.User, { foreignKey: 'recordedById', as: 'recordedBy' });

    // EnvironmentReading <-> StorageZone, User
    m.EnvironmentReading.belongsTo(m.StorageZone, { foreignKey: 'zoneId', as: 'zone' });
    m.EnvironmentReading.belongsTo(m.User, { foreignKey: 'measuredById', as: 'measuredBy' });
    m.StorageZone.hasMany(m.EnvironmentReading, { foreignKey: 'zoneId', as: 'readings' });

    // EnvironmentAlert <-> StorageZone, EnvironmentReading
    m.EnvironmentAlert.belongsTo(m.StorageZone, { foreignKey: 'zoneId', as: 'zone' });
    m.EnvironmentAlert.belongsTo(m.EnvironmentReading, { foreignKey: 'readingId', as: 'reading' });

    // StorageLocation <-> StorageZone, WarehouseBox
    m.StorageLocation.belongsTo(m.StorageZone, { foreignKey: 'zoneId', as: 'zone' });
    m.StorageZone.hasMany(m.StorageLocation, { foreignKey: 'zoneId', as: 'locations' });
    m.WarehouseBox.belongsTo(m.StorageLocation, { foreignKey: 'storageLocationId', as: 'storageLocation' });
    m.StorageLocation.hasMany(m.WarehouseBox, { foreignKey: 'storageLocationId', as: 'boxes' });

    // Shipment <-> ShipmentItem, User, WarehouseBox
    m.Shipment.hasMany(m.ShipmentItem, { foreignKey: 'shipmentId', as: 'items' });
    m.ShipmentItem.belongsTo(m.Shipment, { foreignKey: 'shipmentId', as: 'shipment' });
    m.ShipmentItem.belongsTo(m.WarehouseBox, { foreignKey: 'boxId', as: 'box' });
    m.Shipment.belongsTo(m.User, { foreignKey: 'shippedById', as: 'shippedBy' });
    m.Shipment.belongsTo(m.User, { foreignKey: 'verifiedById', as: 'verifiedBy' });

    // Return <-> ReturnItem, Shipment
    m.Return.hasMany(m.ReturnItem, { foreignKey: 'returnId', as: 'items' });
    m.ReturnItem.belongsTo(m.Return, { foreignKey: 'returnId', as: 'return' });
    m.Return.belongsTo(m.Shipment, { foreignKey: 'shipmentId', as: 'originalShipment' });
  },
};
