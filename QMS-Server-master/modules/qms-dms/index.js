module.exports = {
  code: 'qms.dms',

  register(router) {
    router.use('/documents', require('./routes/documentRouter'));
  },

  getModels() {
    return require('./models/Document');
  },

  setupAssociations(m) {
    if (m.Document && m.User) {
      m.Document.belongsTo(m.User, { as: 'author', foreignKey: 'authorId' });
      m.Document.belongsTo(m.User, { as: 'approver', foreignKey: 'currentApproverId' });
    }
    const { setupDocumentAssociations } = require('./models/Document');
    if (typeof setupDocumentAssociations === 'function') {
      setupDocumentAssociations(m);
    }
  },
};
