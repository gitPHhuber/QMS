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
    if (m.TrainingPlanItem && m.User) {
      m.User.hasMany(m.TrainingPlanItem, { as: 'responsiblePlanItems', foreignKey: 'responsibleId' });
      m.TrainingPlanItem.belongsTo(m.User, { as: 'responsible', foreignKey: 'responsibleId' });
      m.User.hasMany(m.TrainingPlanItem, { as: 'trainerPlanItems', foreignKey: 'trainerId' });
      m.TrainingPlanItem.belongsTo(m.User, { as: 'trainer', foreignKey: 'trainerId' });
    }
  },
};
