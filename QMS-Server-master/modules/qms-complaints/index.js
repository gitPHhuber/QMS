module.exports = {
  code: 'qms.complaints',

  register(router) {
    router.use('/complaints', require('./routes/complaintRouter'));
  },

  getModels() { return require('./models/Complaint'); },

  setupAssociations(m) {
    if (m.Complaint && m.User) {
      m.User.hasMany(m.Complaint, { as: 'assignedComplaints', foreignKey: 'responsibleId' });
      m.Complaint.belongsTo(m.User, { as: 'responsible', foreignKey: 'responsibleId' });
    }
  },
};
