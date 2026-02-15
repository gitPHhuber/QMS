module.exports = {
  code: 'mes.dmr',

  register(router) {
    router.use('/mes/dmr', require('./routes/dmrRouter'));
  },

  getModels() {
    return require('./models/Dmr');
  },

  setupAssociations(m) {
    // DMR -> Product
    if (m.DeviceMasterRecord && m.Product) {
      m.Product.hasMany(m.DeviceMasterRecord, { as: 'dmrs', foreignKey: 'productId' });
      m.DeviceMasterRecord.belongsTo(m.Product, { as: 'product', foreignKey: 'productId' });
    }

    // DMR -> BOMItem (hasMany, CASCADE)
    if (m.DeviceMasterRecord && m.BOMItem) {
      m.DeviceMasterRecord.hasMany(m.BOMItem, { as: 'bomItems', foreignKey: 'dmrId', onDelete: 'CASCADE' });
      m.BOMItem.belongsTo(m.DeviceMasterRecord, { as: 'dmr', foreignKey: 'dmrId' });
    }

    // DMR -> ProcessRoute (hasMany, CASCADE)
    if (m.DeviceMasterRecord && m.ProcessRoute) {
      m.DeviceMasterRecord.hasMany(m.ProcessRoute, { as: 'routes', foreignKey: 'dmrId', onDelete: 'CASCADE' });
      m.ProcessRoute.belongsTo(m.DeviceMasterRecord, { as: 'dmr', foreignKey: 'dmrId' });
    }

    // ProcessRoute -> ProcessRouteStep (hasMany, CASCADE)
    if (m.ProcessRoute && m.ProcessRouteStep) {
      m.ProcessRoute.hasMany(m.ProcessRouteStep, { as: 'steps', foreignKey: 'routeId', onDelete: 'CASCADE' });
      m.ProcessRouteStep.belongsTo(m.ProcessRoute, { as: 'route', foreignKey: 'routeId' });
    }

    // ProcessRouteStep -> StepChecklist (hasMany, CASCADE)
    if (m.ProcessRouteStep && m.StepChecklist) {
      m.ProcessRouteStep.hasMany(m.StepChecklist, { as: 'checklist', foreignKey: 'stepId', onDelete: 'CASCADE' });
      m.StepChecklist.belongsTo(m.ProcessRouteStep, { as: 'step', foreignKey: 'stepId' });
    }

    // DMR self-ref (previousVersionId)
    if (m.DeviceMasterRecord) {
      m.DeviceMasterRecord.belongsTo(m.DeviceMasterRecord, { as: 'previousVersion', foreignKey: 'previousVersionId' });
    }

    // DMR -> ChangeRequest
    if (m.DeviceMasterRecord && m.ChangeRequest) {
      m.DeviceMasterRecord.belongsTo(m.ChangeRequest, { as: 'changeRequest', foreignKey: 'changeRequestId' });
    }

    // DMR -> User (createdBy, approvedBy)
    if (m.DeviceMasterRecord && m.User) {
      m.DeviceMasterRecord.belongsTo(m.User, { as: 'createdBy', foreignKey: 'createdById' });
      m.DeviceMasterRecord.belongsTo(m.User, { as: 'approvedBy', foreignKey: 'approvedById' });
    }

    // ProcessRoute -> User (createdBy)
    if (m.ProcessRoute && m.User) {
      m.ProcessRoute.belongsTo(m.User, { as: 'createdBy', foreignKey: 'createdById' });
    }
  },
};
