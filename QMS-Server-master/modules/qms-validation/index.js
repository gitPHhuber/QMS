module.exports = {
  code: 'qms.validation',

  register(router) {
    router.use('/process-validations', require('./routes/validationRouter'));
  },

  getModels() {
    return {
      ...require('./models/ProcessValidation'),
      ...require('./models/ValidationProtocol'),
    };
  },

  setupAssociations(m) {
    if (m.ProcessValidation && m.User) {
      m.User.hasMany(m.ProcessValidation, { as: 'validations', foreignKey: 'responsibleId' });
      m.ProcessValidation.belongsTo(m.User, { as: 'responsible', foreignKey: 'responsibleId' });
    }
    // ValidationProtocolTemplate associations with User
    if (m.ValidationProtocolTemplate && m.User) {
      m.User.hasMany(m.ValidationProtocolTemplate, { as: 'createdTemplates', foreignKey: 'createdById' });
      m.ValidationProtocolTemplate.belongsTo(m.User, { as: 'createdBy', foreignKey: 'createdById' });
      m.User.hasMany(m.ValidationProtocolTemplate, { as: 'approvedTemplates', foreignKey: 'approvedById' });
      m.ValidationProtocolTemplate.belongsTo(m.User, { as: 'approvedBy', foreignKey: 'approvedById' });
    }
    // ValidationChecklist associations with ProcessValidation and User
    if (m.ValidationChecklist && m.ProcessValidation) {
      m.ProcessValidation.hasMany(m.ValidationChecklist, { as: 'checklists', foreignKey: 'processValidationId' });
      m.ValidationChecklist.belongsTo(m.ProcessValidation, { as: 'processValidation', foreignKey: 'processValidationId' });
    }
    if (m.ValidationChecklist && m.User) {
      m.User.hasMany(m.ValidationChecklist, { as: 'executedChecklists', foreignKey: 'executedById' });
      m.ValidationChecklist.belongsTo(m.User, { as: 'executedBy', foreignKey: 'executedById' });
      m.User.hasMany(m.ValidationChecklist, { as: 'reviewedChecklists', foreignKey: 'reviewedById' });
      m.ValidationChecklist.belongsTo(m.User, { as: 'reviewedBy', foreignKey: 'reviewedById' });
    }
    // ValidationChecklistItem associations with User
    if (m.ValidationChecklistItem && m.User) {
      m.User.hasMany(m.ValidationChecklistItem, { as: 'executedChecklistItems', foreignKey: 'executedById' });
      m.ValidationChecklistItem.belongsTo(m.User, { as: 'executedBy', foreignKey: 'executedById' });
    }
  },
};
