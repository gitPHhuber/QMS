module.exports = {
  code: 'qms.validation',

  register(router) {
    router.use('/process-validations', require('./routes/validationRouter'));
  },

  getModels() { return require('./models/ProcessValidation'); },

  setupAssociations(m) {
    if (m.ProcessValidation && m.User) {
      m.User.hasMany(m.ProcessValidation, { as: 'validations', foreignKey: 'responsibleId' });
      m.ProcessValidation.belongsTo(m.User, { as: 'responsible', foreignKey: 'responsibleId' });
    }
  },
};
