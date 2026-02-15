module.exports = {
  code: 'qms.equipment',

  register(router) {
    router.use('/equipment', require('./routes/equipmentRouter'));
    router.use('/environment', require('./routes/environmentRouter'));
  },

  getModels() {
    return {
      ...require('./models/Equipment'),
      ...require('./models/EnvironmentalMonitoring'),
    };
  },

  setupAssociations(m) {
    if (m.Equipment && m.User) {
      m.User.hasMany(m.Equipment, { as: 'responsibleEquipment', foreignKey: 'responsibleId' });
      m.Equipment.belongsTo(m.User, { as: 'responsible', foreignKey: 'responsibleId' });
    }
    // Environmental Monitoring associations
    if (m.EnvironmentalMonitoringPoint && m.Equipment) {
      m.EnvironmentalMonitoringPoint.belongsTo(m.Equipment, { as: 'equipment', foreignKey: 'equipmentId' });
      m.Equipment.hasMany(m.EnvironmentalMonitoringPoint, { as: 'monitoringPoints', foreignKey: 'equipmentId' });
    }
    if (m.EnvironmentalMonitoringPoint && m.User) {
      m.EnvironmentalMonitoringPoint.belongsTo(m.User, { as: 'responsible', foreignKey: 'responsibleId' });
    }
    if (m.EnvironmentalReading && m.User) {
      m.EnvironmentalReading.belongsTo(m.User, { as: 'recordedBy', foreignKey: 'recordedById' });
    }
  },
};
