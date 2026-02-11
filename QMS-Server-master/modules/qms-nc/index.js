module.exports = {
  code: 'qms.nc',

  register(router) {
    router.use('/nc', require('./routes/ncCapaRouter'));
  },

  getModels() {
    return require('./models/NcCapa');
  },

  setupAssociations(m) {
    const { setupNcCapaAssociations } = require('./models/NcCapa');
    if (typeof setupNcCapaAssociations === 'function') {
      setupNcCapaAssociations(m);
    }
  },
};
