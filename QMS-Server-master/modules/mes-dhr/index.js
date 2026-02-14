module.exports = {
  code: 'mes.dhr',

  register(router) {
    router.use('/dhr', require('./routes/dhrRouter'));
  },

  getModels() {
    return require('./models/Dhr');
  },

  setupAssociations(m) {
    // DHR -> Product
    if (m.DeviceHistoryRecord && m.Product) {
      m.Product.hasMany(m.DeviceHistoryRecord, { as: 'dhrs', foreignKey: 'productId' });
      m.DeviceHistoryRecord.belongsTo(m.Product, { as: 'product', foreignKey: 'productId' });
    }
    // DHR -> MaterialTrace, ProcessStep
    if (m.DeviceHistoryRecord && m.DhrMaterialTrace) {
      m.DeviceHistoryRecord.hasMany(m.DhrMaterialTrace, { as: 'materials', foreignKey: 'dhrId', onDelete: 'CASCADE' });
      m.DhrMaterialTrace.belongsTo(m.DeviceHistoryRecord, { as: 'dhr', foreignKey: 'dhrId' });
    }
    if (m.DeviceHistoryRecord && m.DhrProcessStep) {
      m.DeviceHistoryRecord.hasMany(m.DhrProcessStep, { as: 'steps', foreignKey: 'dhrId', onDelete: 'CASCADE' });
      m.DhrProcessStep.belongsTo(m.DeviceHistoryRecord, { as: 'dhr', foreignKey: 'dhrId' });
    }
    // User references
    if (m.DeviceHistoryRecord && m.User) {
      m.DeviceHistoryRecord.belongsTo(m.User, { as: 'qcInspector', foreignKey: 'qcInspectorId' });
      m.DeviceHistoryRecord.belongsTo(m.User, { as: 'releasedBy', foreignKey: 'releasedById' });
    }
    if (m.DhrProcessStep && m.User) {
      m.DhrProcessStep.belongsTo(m.User, { as: 'operator', foreignKey: 'operatorId' });
    }
  },
};
