module.exports = {
  code: 'mes.routes',

  register(router) {
    router.use('/mes/route-sheets', require('./routes/routeSheetRouter'));
  },

  getModels() {
    return require('./models/RouteSheet');
  },

  setupAssociations(m) {
    // OperationRecord -> WorkOrderUnit
    if (m.OperationRecord && m.WorkOrderUnit) {
      m.WorkOrderUnit.hasMany(m.OperationRecord, { as: 'operations', foreignKey: 'unitId' });
      m.OperationRecord.belongsTo(m.WorkOrderUnit, { as: 'unit', foreignKey: 'unitId' });
    }
    // OperationRecord -> ProcessRouteStep
    if (m.OperationRecord && m.ProcessRouteStep) {
      m.OperationRecord.belongsTo(m.ProcessRouteStep, { as: 'routeStep', foreignKey: 'routeStepId' });
    }
    // OperationRecord -> ProductionTask
    if (m.OperationRecord && m.ProductionTask) {
      m.ProductionTask.hasMany(m.OperationRecord, { as: 'operations', foreignKey: 'workOrderId' });
      m.OperationRecord.belongsTo(m.ProductionTask, { as: 'workOrder', foreignKey: 'workOrderId' });
    }
    // OperationRecord -> User (operator, inspector)
    if (m.OperationRecord && m.User) {
      m.OperationRecord.belongsTo(m.User, { as: 'operator', foreignKey: 'operatorId' });
      m.OperationRecord.belongsTo(m.User, { as: 'inspector', foreignKey: 'inspectorId' });
    }
    // ChecklistResponse -> OperationRecord
    if (m.ChecklistResponse && m.OperationRecord) {
      m.OperationRecord.hasMany(m.ChecklistResponse, { as: 'responses', foreignKey: 'operationId', onDelete: 'CASCADE' });
      m.ChecklistResponse.belongsTo(m.OperationRecord, { as: 'operation', foreignKey: 'operationId' });
    }
    // ChecklistResponse -> StepChecklist
    if (m.ChecklistResponse && m.StepChecklist) {
      m.ChecklistResponse.belongsTo(m.StepChecklist, { as: 'checklistItem', foreignKey: 'checklistItemId' });
    }
    // ChecklistResponse -> User
    if (m.ChecklistResponse && m.User) {
      m.ChecklistResponse.belongsTo(m.User, { as: 'respondedBy', foreignKey: 'respondedById' });
    }
  },
};
