module.exports = {
  code: 'qms.audit',

  register(router) {
    router.use('/internal-audits', require('./routes/internalAuditRouter'));
  },

  getModels() { return require('./models/InternalAudit'); },

  setupAssociations({ User }) {
    const { AuditChecklistResponse, AuditFinding } = require('./models/InternalAudit');

    // AuditChecklistResponse → User (аудитор)
    if (User && AuditChecklistResponse) {
      AuditChecklistResponse.belongsTo(User, { as: "auditor", foreignKey: "auditorId" });
    }
  },
};
