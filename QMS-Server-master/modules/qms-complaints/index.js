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

      m.User.hasMany(m.Complaint, { as: 'createdComplaints', foreignKey: 'createdById' });
      m.Complaint.belongsTo(m.User, { as: 'createdBy', foreignKey: 'createdById' });

      m.User.hasMany(m.Complaint, { as: 'closedComplaints', foreignKey: 'closedById' });
      m.Complaint.belongsTo(m.User, { as: 'closedByUser', foreignKey: 'closedById' });

      m.User.hasMany(m.Complaint, { as: 'vigilanceSubmissions', foreignKey: 'vigilanceSubmittedById' });
      m.Complaint.belongsTo(m.User, { as: 'vigilanceSubmittedBy', foreignKey: 'vigilanceSubmittedById' });
    }
  },
};
