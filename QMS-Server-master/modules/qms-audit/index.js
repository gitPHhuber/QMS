module.exports = {
  code: 'qms.audit',

  register(router) {
    router.use('/internal-audits', require('./routes/internalAuditRouter'));
  },

  getModels() { return require('./models/InternalAudit'); },
  setupAssociations() {},
};
