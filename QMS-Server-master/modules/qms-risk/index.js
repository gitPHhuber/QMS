module.exports = {
  code: 'qms.risk',

  register(router) {
    router.use('/risks', require('./routes/riskRouter'));
  },

  getModels() {
    return require('./models/Risk');
  },

  setupAssociations(m) {
    if (m.RiskRegister && m.User) {
      m.User.hasMany(m.RiskRegister, { as: 'ownedRisks', foreignKey: 'ownerId' });
      m.RiskRegister.belongsTo(m.User, { as: 'owner', foreignKey: 'ownerId' });
    }
  },
};
