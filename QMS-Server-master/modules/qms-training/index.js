module.exports = {
  code: 'qms.training',

  register(router) {
    router.use('/training', require('./routes/trainingRouter'));
  },

  getModels() { return require('./models/Training'); },

  setupAssociations(m) {
    if (m.TrainingRecord && m.User) {
      m.User.hasMany(m.TrainingRecord, { as: 'trainings', foreignKey: 'userId' });
      m.TrainingRecord.belongsTo(m.User, { as: 'trainee', foreignKey: 'userId' });
    }
    if (m.CompetencyMatrix && m.User) {
      m.User.hasMany(m.CompetencyMatrix, { as: 'competencies', foreignKey: 'userId' });
      m.CompetencyMatrix.belongsTo(m.User, { as: 'user', foreignKey: 'userId' });
    }
  },
};
