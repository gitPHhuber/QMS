module.exports = {
  code: 'core.esign',

  register(router) {
    router.use('/esign', require('./routes/esignRouter'));
  },

  getModels() {
    return require('./models/ESign');
  },

  setupAssociations(m) {
    const { setupESignAssociations } = require('./models/ESign');
    if (typeof setupESignAssociations === 'function') {
      setupESignAssociations(m);
    }
  },
};
