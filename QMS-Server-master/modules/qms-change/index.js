module.exports = {
  code: 'qms.changes',

  register(router) {
    router.use('/change-requests', require('./routes/changeRouter'));
  },

  getModels() { return require('./models/ChangeRequest'); },

  setupAssociations(m) {
    if (m.ChangeRequest && m.User) {
      m.User.hasMany(m.ChangeRequest, { as: 'initiatedChanges', foreignKey: 'initiatorId' });
      m.ChangeRequest.belongsTo(m.User, { as: 'initiator', foreignKey: 'initiatorId' });
    }
  },
};
