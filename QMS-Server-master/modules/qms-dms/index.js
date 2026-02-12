module.exports = {
  code: 'qms.dms',

  register(router) {
    router.use('/documents', require('./routes/documentRouter'));
  },

  getModels() {
    return require('./models/Document');
  },

  setupAssociations(m) {
    const { setupDocumentAssociations } = require('./models/Document');
    if (typeof setupDocumentAssociations === 'function') {
      setupDocumentAssociations(m);
    }
  },
};
