module.exports = {
  code: 'qms.risk',

  register(router) {
    router.use('/risks', require('./routes/riskRouter'));
    router.use('/risk-management', require('./routes/riskManagementRouter'));
  },

  getModels() {
    return {
      ...require('./models/Risk'),
      ...require('./models/RiskManagement'),
    };
  },

  setupAssociations(m) {
    // RiskRegister <-> User
    if (m.RiskRegister && m.User) {
      m.User.hasMany(m.RiskRegister, { as: 'ownedRisks', foreignKey: 'ownerId' });
      m.RiskRegister.belongsTo(m.User, { as: 'owner', foreignKey: 'ownerId' });
    }


    if (m.RiskMitigation && m.Capa) {
      m.RiskMitigation.belongsTo(m.Capa, { as: 'capa', foreignKey: 'capaId' });
      m.Capa.hasMany(m.RiskMitigation, { as: 'riskMitigations', foreignKey: 'capaId' });

    // RiskManagementPlan <-> User (responsible person)
    if (m.RiskManagementPlan && m.User) {
      m.User.hasMany(m.RiskManagementPlan, { as: 'riskManagementPlans', foreignKey: 'responsiblePersonId' });
      m.RiskManagementPlan.belongsTo(m.User, { as: 'responsiblePerson', foreignKey: 'responsiblePersonId' });
    }

    // BenefitRiskAnalysis <-> User (assessor)
    if (m.BenefitRiskAnalysis && m.User) {
      m.User.hasMany(m.BenefitRiskAnalysis, { as: 'benefitRiskAssessments', foreignKey: 'assessorId' });
      m.BenefitRiskAnalysis.belongsTo(m.User, { as: 'assessor', foreignKey: 'assessorId' });
    }

    // Hazard <-> RiskRegister (cross-link)
    if (m.Hazard && m.RiskRegister) {
      m.RiskRegister.hasMany(m.Hazard, { as: 'linkedHazards', foreignKey: 'linkedRiskRegisterId' });
      m.Hazard.belongsTo(m.RiskRegister, { as: 'linkedRiskRegister', foreignKey: 'linkedRiskRegisterId' });
    }

    // RiskControlTraceability <-> RiskMitigation (cross-link)
    if (m.RiskControlTraceability && m.RiskMitigation) {
      m.RiskMitigation.hasMany(m.RiskControlTraceability, { as: 'traceabilityRecords', foreignKey: 'linkedMitigationId' });
      m.RiskControlTraceability.belongsTo(m.RiskMitigation, { as: 'linkedMitigation', foreignKey: 'linkedMitigationId' });

    }
  },
};
