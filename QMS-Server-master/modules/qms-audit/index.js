module.exports = {
  code: 'qms.audit',
  register() {},
  getModels() { return require('./models/InternalAudit'); },
  setupAssociations() {},
};
