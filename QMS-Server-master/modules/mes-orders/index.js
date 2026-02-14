module.exports = {
  code: 'mes.orders',
  register(router) {
    router.use('/mes/work-orders', require('./routes/workOrderRouter'));
  },
  getModels() {
    return require('./models/WorkOrder');
  },
  setupAssociations(m) {
    // WorkOrderUnit -> ProductionTask
    if (m.WorkOrderUnit && m.ProductionTask) {
      m.ProductionTask.hasMany(m.WorkOrderUnit, { as: 'units', foreignKey: 'workOrderId' });
      m.WorkOrderUnit.belongsTo(m.ProductionTask, { as: 'workOrder', foreignKey: 'workOrderId' });
    }
    // WorkOrderUnit -> ProcessRouteStep (currentStep)
    if (m.WorkOrderUnit && m.ProcessRouteStep) {
      m.WorkOrderUnit.belongsTo(m.ProcessRouteStep, { as: 'currentStep', foreignKey: 'currentStepId' });
    }
    // WorkOrderUnit -> DeviceHistoryRecord
    if (m.WorkOrderUnit && m.DeviceHistoryRecord) {
      m.WorkOrderUnit.belongsTo(m.DeviceHistoryRecord, { as: 'dhr', foreignKey: 'dhrId' });
    }
    // WorkOrderMaterial -> ProductionTask
    if (m.WorkOrderMaterial && m.ProductionTask) {
      m.ProductionTask.hasMany(m.WorkOrderMaterial, { as: 'materials', foreignKey: 'workOrderId' });
      m.WorkOrderMaterial.belongsTo(m.ProductionTask, { as: 'workOrder', foreignKey: 'workOrderId' });
    }
    // WorkOrderMaterial -> BOMItem
    if (m.WorkOrderMaterial && m.BOMItem) {
      m.WorkOrderMaterial.belongsTo(m.BOMItem, { as: 'bomItem', foreignKey: 'bomItemId' });
    }
    // WorkOrderMaterial -> WarehouseBox
    if (m.WorkOrderMaterial && m.WarehouseBox) {
      m.WorkOrderMaterial.belongsTo(m.WarehouseBox, { as: 'warehouseBox', foreignKey: 'warehouseBoxId' });
    }
    // WorkOrderReadinessCheck -> ProductionTask
    if (m.WorkOrderReadinessCheck && m.ProductionTask) {
      m.ProductionTask.hasMany(m.WorkOrderReadinessCheck, { as: 'readinessChecks', foreignKey: 'workOrderId' });
      m.WorkOrderReadinessCheck.belongsTo(m.ProductionTask, { as: 'workOrder', foreignKey: 'workOrderId' });
    }
    // WorkOrderReadinessCheck -> User
    if (m.WorkOrderReadinessCheck && m.User) {
      m.WorkOrderReadinessCheck.belongsTo(m.User, { as: 'performedBy', foreignKey: 'performedById' });
    }
    // WorkOrderUnit -> User (NC link is optional)
    // ProductionTask -> DMR associations (if DMR module loaded)
    if (m.ProductionTask && m.DeviceMasterRecord) {
      m.ProductionTask.belongsTo(m.DeviceMasterRecord, { as: 'dmr', foreignKey: 'dmrId' });
    }
    if (m.ProductionTask && m.ProcessRoute) {
      m.ProductionTask.belongsTo(m.ProcessRoute, { as: 'processRoute', foreignKey: 'processRouteId' });
    }
  },
};
