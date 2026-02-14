module.exports = {
  code: 'mes.quality',

  register(router) {
    router.use('/mes/quality', require('./routes/mesQualityRouter'));
    router.use('/mes/acceptance-tests', require('./routes/acceptanceTestRouter'));
  },

  getModels() {
    return require('./models/MesQuality');
  },

  setupAssociations(m) {
    // AcceptanceTest -> Product
    if (m.AcceptanceTest && m.Product) {
      m.Product.hasMany(m.AcceptanceTest, { as: 'acceptanceTests', foreignKey: 'productId' });
      m.AcceptanceTest.belongsTo(m.Product, { as: 'product', foreignKey: 'productId' });
    }
    // AcceptanceTest -> WorkOrderUnit
    if (m.AcceptanceTest && m.WorkOrderUnit) {
      m.AcceptanceTest.belongsTo(m.WorkOrderUnit, { as: 'unit', foreignKey: 'unitId' });
    }
    // AcceptanceTest -> AcceptanceTestTemplate
    if (m.AcceptanceTest && m.AcceptanceTestTemplate) {
      m.AcceptanceTest.belongsTo(m.AcceptanceTestTemplate, { as: 'template', foreignKey: 'templateId' });
    }
    // AcceptanceTest -> AcceptanceTestItem (CASCADE)
    if (m.AcceptanceTest && m.AcceptanceTestItem) {
      m.AcceptanceTest.hasMany(m.AcceptanceTestItem, { as: 'items', foreignKey: 'testId', onDelete: 'CASCADE' });
      m.AcceptanceTestItem.belongsTo(m.AcceptanceTest, { as: 'test', foreignKey: 'testId' });
    }
    // AcceptanceTest self-ref (retest)
    if (m.AcceptanceTest) {
      m.AcceptanceTest.belongsTo(m.AcceptanceTest, { as: 'originalTest', foreignKey: 'originalTestId' });
    }
    // AcceptanceTest -> User (submitter, tester, decision maker)
    if (m.AcceptanceTest && m.User) {
      m.AcceptanceTest.belongsTo(m.User, { as: 'submittedBy', foreignKey: 'submittedById' });
      m.AcceptanceTest.belongsTo(m.User, { as: 'tester', foreignKey: 'testerId' });
      m.AcceptanceTest.belongsTo(m.User, { as: 'decisionBy', foreignKey: 'decisionById' });
    }
    // AcceptanceTestItem -> User
    if (m.AcceptanceTestItem && m.User) {
      m.AcceptanceTestItem.belongsTo(m.User, { as: 'testedBy', foreignKey: 'testedById' });
    }
    // AcceptanceTestTemplate -> Product
    if (m.AcceptanceTestTemplate && m.Product) {
      m.AcceptanceTestTemplate.belongsTo(m.Product, { as: 'product', foreignKey: 'productId' });
    }
    // AcceptanceTestTemplate -> User
    if (m.AcceptanceTestTemplate && m.User) {
      m.AcceptanceTestTemplate.belongsTo(m.User, { as: 'createdBy', foreignKey: 'createdById' });
    }
  },
};
