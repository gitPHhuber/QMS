module.exports = {
  code: 'mes.kpi',

  register(router) {
    router.use('/mes/kpi', require('./routes/mesKpiRouter'));
  },

  getModels() {
    return require('./models/MesKpi');
  },

  setupAssociations(m) {
    if (m.ProductionKpiTarget && m.Product) {
      m.ProductionKpiTarget.belongsTo(m.Product, { as: 'product', foreignKey: 'productId' });
    }
    if (m.ProductionKpiTarget && m.User) {
      m.ProductionKpiTarget.belongsTo(m.User, { as: 'createdBy', foreignKey: 'createdById' });
    }
  },
};
