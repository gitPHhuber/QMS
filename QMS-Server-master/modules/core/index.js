module.exports = {
  code: 'core',

  register(router) {
    router.use('/users',     require('./routes/userRouter'));
    router.use('/sessions',  require('./routes/sessionRouter'));
    router.use('/pcs',       require('./routes/pcRouter'));
    router.use('/rbac',      require('./routes/rbacRouter'));
    router.use('/structure', require('./routes/structureRouter'));
    router.use('/audit',     require('./routes/auditRouter'));
    router.use('/tasks',     require('./routes/taskRouter'));
    router.use('/projects',  require('./routes/projectRouter'));
    router.use('/notifications', require('./routes/notificationRouter'));
  },

  getModels() {
    const general = require('./models/General');
    const structure = require('./models/Structure');
    const project = require('./models/Project');
    const notification = require('./models/Notification');
    return { ...general, ...structure, ...project, ...notification };
  },

  setupAssociations(m) {
    // User <-> Session
    m.User.hasMany(m.Session);
    m.Session.belongsTo(m.User);
    m.Session.belongsTo(m.PC, { foreignKey: 'PCId', as: 'pc' });
    m.PC.hasMany(m.Session, { foreignKey: 'PCId', as: 'sessions' });

    // User <-> AuditLog
    m.AuditLog.belongsTo(m.User, { foreignKey: 'userId', as: 'User' });
    m.User.hasMany(m.AuditLog, { foreignKey: 'userId', as: 'auditLogs' });

    // User <-> Team <-> Section
    m.User.belongsTo(m.Team, { foreignKey: 'teamId' });
    m.Team.hasMany(m.User, { foreignKey: 'teamId' });
    m.Team.belongsTo(m.Section, { foreignKey: 'sectionId', as: 'section' });
    m.Section.hasMany(m.Team, { foreignKey: 'sectionId', as: 'teams' });
    m.Team.belongsTo(m.User, { foreignKey: 'teamLeadId', as: 'teamLead' });
    m.Section.belongsTo(m.User, { foreignKey: 'managerId', as: 'manager' });
    m.User.hasMany(m.Section, { foreignKey: 'managerId', as: 'managedSections' });

    // RBAC
    m.Role.belongsToMany(m.Ability, { through: m.RoleAbility, foreignKey: 'roleId', as: 'abilities' });
    m.Ability.belongsToMany(m.Role, { through: m.RoleAbility, foreignKey: 'abilityId', as: 'roles' });
    m.User.belongsTo(m.Role, { foreignKey: 'roleId', as: 'userRole' });

    // Project <-> User
    m.Project.belongsTo(m.User, { foreignKey: 'createdById', as: 'author' });
    m.User.hasMany(m.Project, { foreignKey: 'createdById', as: 'projects' });

    // Notification <-> User
    if (m.Notification) {
      m.Notification.belongsTo(m.User, { foreignKey: 'userId', as: 'user' });
      m.User.hasMany(m.Notification, { foreignKey: 'userId', as: 'notifications' });
    }
  },
};
