module.exports = {
  code: 'qms.changes',

  register(router) {
    router.use('/change-requests', require('./routes/changeRouter'));
  },

  getModels() {
    return {
      ...require('./models/ChangeRequest'),
      ...require('./models/ChangeImpactItem'),
    };
  },

  setupAssociations(m) {
    if (m.ChangeRequest && m.User) {
      m.User.hasMany(m.ChangeRequest, { as: 'initiatedChanges', foreignKey: 'initiatorId' });
      m.ChangeRequest.belongsTo(m.User, { as: 'initiator', foreignKey: 'initiatorId' });
    }
    if (m.ChangeImpactItem && m.ChangeRequest) {
      m.ChangeRequest.hasMany(m.ChangeImpactItem, { as: 'impactItems', foreignKey: 'changeRequestId' });
      m.ChangeImpactItem.belongsTo(m.ChangeRequest, { as: 'changeRequest', foreignKey: 'changeRequestId' });
    }
    if (m.ChangeImpactItem && m.User) {
      m.User.hasMany(m.ChangeImpactItem, { as: 'assessedImpacts', foreignKey: 'assessedById' });
      m.ChangeImpactItem.belongsTo(m.User, { as: 'assessedBy', foreignKey: 'assessedById' });
    }
  },
};
