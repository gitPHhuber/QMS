module.exports = {
  code: 'qms.dashboard',

  register(router) {
    router.use('/dashboard', require('./routes/dashboardRouter'));
  },

  getModels() {
    return require('./models/QualityObjective');
  },

  setupAssociations(m) {
    const { setupQualityObjectiveAssociations } = require('./models/QualityObjective');
    if (typeof setupQualityObjectiveAssociations === 'function') {
      setupQualityObjectiveAssociations(m);
    }
  },
};
