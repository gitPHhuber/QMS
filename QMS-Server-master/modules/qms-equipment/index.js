module.exports = {
  code: 'qms.equipment',
  register() {},
  getModels() { return require('./models/Equipment'); },
  setupAssociations(m) {
    if (m.Equipment && m.User) {
      m.User.hasMany(m.Equipment, { as: 'responsibleEquipment', foreignKey: 'responsibleId' });
      m.Equipment.belongsTo(m.User, { as: 'responsible', foreignKey: 'responsibleId' });
    }
  },
};
