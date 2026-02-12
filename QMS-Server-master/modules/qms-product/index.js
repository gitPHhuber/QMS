module.exports = {
  code: 'qms.product',

  register(router) {
    router.use('/products', require('./routes/productRouter'));
  },

  getModels() { return require('./models/Product'); },

  setupAssociations(m) {
    if (m.Product && m.User) {
      m.User.hasMany(m.Product, { as: 'designedProducts', foreignKey: 'designOwnerId' });
      m.Product.belongsTo(m.User, { as: 'designOwner', foreignKey: 'designOwnerId' });
      m.User.hasMany(m.Product, { as: 'qualityProducts', foreignKey: 'qualityOwnerId' });
      m.Product.belongsTo(m.User, { as: 'qualityOwner', foreignKey: 'qualityOwnerId' });
    }
  },
};
