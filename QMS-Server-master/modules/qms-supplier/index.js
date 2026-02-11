module.exports = {
  code: 'qms.supplier',

  register(router) {
    router.use('/suppliers', require('./routes/supplierRouter'));
  },

  getModels() { return require('./models/Supplier'); },
  setupAssociations() {},
};
