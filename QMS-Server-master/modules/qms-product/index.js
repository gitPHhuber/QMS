module.exports = {
  code: 'qms.product',

  register(router) {
    router.use('/products', require('./routes/productRouter'));
    router.use('/customer-requirements', require('./routes/customerRequirementRouter'));
  },

  getModels() {
    return {
      ...require('./models/Product'),
      ...require('./models/DmfSection'),
      ...require('./models/CustomerRequirement'),
    };
  },

  setupAssociations(m) {
    if (m.Product && m.User) {
      m.User.hasMany(m.Product, { as: 'designedProducts', foreignKey: 'designOwnerId' });
      m.Product.belongsTo(m.User, { as: 'designOwner', foreignKey: 'designOwnerId' });
      m.User.hasMany(m.Product, { as: 'qualityProducts', foreignKey: 'qualityOwnerId' });
      m.Product.belongsTo(m.User, { as: 'qualityOwner', foreignKey: 'qualityOwnerId' });
    }
    if (m.Product && m.DmfSection) {
      m.Product.hasMany(m.DmfSection, { as: 'dmfSections', foreignKey: 'productId', onDelete: 'CASCADE' });
      m.DmfSection.belongsTo(m.Product, { as: 'product', foreignKey: 'productId' });
    }
    if (m.DmfSection && m.User) {
      m.DmfSection.belongsTo(m.User, { as: 'lastReviewedBy', foreignKey: 'lastReviewedById' });
    }
    // Customer Requirements associations
    if (m.CustomerRequirement && m.Product) {
      m.Product.hasMany(m.CustomerRequirement, { as: 'customerRequirements', foreignKey: 'productId' });
      m.CustomerRequirement.belongsTo(m.Product, { as: 'product', foreignKey: 'productId' });
    }
    if (m.CustomerRequirement && m.User) {
      m.CustomerRequirement.belongsTo(m.User, { as: 'reviewedBy', foreignKey: 'reviewedById' });
      m.CustomerRequirement.belongsTo(m.User, { as: 'responsible', foreignKey: 'responsibleId' });
    }
  },
};
