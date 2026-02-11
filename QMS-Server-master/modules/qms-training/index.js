module.exports = {
  code: 'qms.training',
  register() {},
  getModels() { return require('./models/Training'); },
  setupAssociations(m) {
    if (m.TrainingRecord && m.User) {
      m.User.hasMany(m.TrainingRecord, { as: 'trainings', foreignKey: 'userId' });
      m.TrainingRecord.belongsTo(m.User, { as: 'trainee', foreignKey: 'userId' });
    }
  },
};
