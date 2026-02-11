module.exports = {
  code: 'wms.warehouse',

  register(router) {
    router.use('/warehouse', require('./routes/warehouseRouter'));
  },

  getModels() {
    return require('./models/Warehouse');
  },

  setupAssociations(m) {
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
      m.ProductionTask.belongsTo(m.Section, { foreignKey: 'targetSectionId', as: 'targetSection' });
      if (m.Project) {
        m.ProductionTask.belongsTo(m.Project, { foreignKey: 'projectId', as: 'project' });
      }
    }
  },
};
