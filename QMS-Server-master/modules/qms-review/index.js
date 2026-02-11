module.exports = {
  code: 'qms.review',

  register(router) {
    router.use('/reviews', require('./routes/reviewRouter'));
  },

  getModels() { return require('./models/ManagementReview'); },
  setupAssociations() {},
};
