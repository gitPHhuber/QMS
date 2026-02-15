module.exports = {
  code: 'qms.design',

  register(router) {
    router.use('/design', require('./routes/designRouter'));
  },

  getModels() {
    return require('./models/Design');
  },

  setupAssociations(m) {
    const { setupDesignAssociations } = require('./models/Design');
    if (typeof setupDesignAssociations === 'function') {
      setupDesignAssociations(m);
    }
  },
};
