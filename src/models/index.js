const { Sequelize } = require('sequelize');
const config = require('../config/database.py');

const sequelize = new Sequelize(config);

const models = {
  User: require('./users')(sequelize),
  Company: require('./company')(sequelize),
  Job: require('./job')(sequelize),
  Application: require('./application')(sequelize),
  Bookmark: require('./bookmark')(sequelize),
  Skill: require('./skill')(sequelize),
  JobSkill: require('./jobSkill')(sequelize),
  UserSkill: require('./userSkill')(sequelize),
  Benefit: require('./benefit')(sequelize),
  Interview: require('./interview')(sequelize),
  JobStat: require('./jobStat')(sequelize),
  Salary: require('./salary')(sequelize)
};

// 사용자-지원 관계 (1:N)
models.User.hasMany(models.Application, { foreignKey: 'user_id', as: 'applications' });
models.Application.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });

// 채용공고-지원 관계 (1:N)
models.Job.hasMany(models.Application, { foreignKey: 'job_id', as: 'applications' });
models.Application.belongsTo(models.Job, { foreignKey: 'job_id', as: 'job' });

// 회사-채용공고 관계 (1:N)
models.Company.hasMany(models.Job, { foreignKey: 'company_id', as: 'jobs' });
models.Job.belongsTo(models.Company, { foreignKey: 'company_id', as: 'company' });

// 사용자-북마크-채용공고 관계 (N:M)
models.User.belongsToMany(models.Job, {
  through: models.Bookmark,
  foreignKey: 'user_id',
  as: 'bookmarked_jobs'
});
models.Job.belongsToMany(models.User, {
  through: models.Bookmark,
  foreignKey: 'job_id',
  as: 'bookmarked_by_users'
});

// 채용공고-기술스택 관계 (N:M)
models.Job.belongsToMany(models.Skill, {
  through: models.JobSkill,
  foreignKey: 'job_id',
  as: 'skills'
});
models.Skill.belongsToMany(models.Job, {
  through: models.JobSkill,
  foreignKey: 'skill_id',
  as: 'jobs'
});

// 사용자-기술스택 관계 (N:M)
models.User.belongsToMany(models.Skill, {
  through: models.UserSkill,
  foreignKey: 'user_id',
  as: 'skills'
});
models.Skill.belongsToMany(models.User, {
  through: models.UserSkill,
  foreignKey: 'skill_id',
  as: 'users'
});

// 채용공고-혜택 관계 (1:N)
models.Job.hasMany(models.Benefit, { foreignKey: 'job_id', as: 'benefits' });
models.Benefit.belongsTo(models.Job, { foreignKey: 'job_id', as: 'job' });

// 채용공고-면접 관계 (1:N)
models.Job.hasMany(models.Interview, { foreignKey: 'job_id', as: 'interviews' });
models.Interview.belongsTo(models.Job, { foreignKey: 'job_id', as: 'job' });

// 사용자-면접 관계 (1:N)
models.User.hasMany(models.Interview, { foreignKey: 'user_id', as: 'interviews' });
models.Interview.belongsTo(models.User, { foreignKey: 'user_id', as: 'interviewer' });

// 채용공고-통계 관계 (1:1)
models.Job.hasOne(models.JobStat, { foreignKey: 'job_id', as: 'statistics' });
models.JobStat.belongsTo(models.Job, { foreignKey: 'job_id', as: 'job' });

// 채용공고-급여 관계 (1:1)
models.Job.hasOne(models.Salary, { foreignKey: 'job_num', as: 'salary_info' });
models.Salary.belongsTo(models.Job, { foreignKey: 'job_num', as: 'job' });

// 회사-면접 관계 (1:N)
models.Company.hasMany(models.Interview, { foreignKey: 'company_id', as: 'interviews' });
models.Interview.belongsTo(models.Company, { foreignKey: 'company_id', as: 'company' });

// 회사-혜택 관계 (1:N)
models.Company.hasMany(models.Benefit, { foreignKey: 'company_id', as: 'benefits' });
models.Benefit.belongsTo(models.Company, { foreignKey: 'company_id', as: 'company' });

sequelize.authenticate()
  .then(() => {
    console.log('Database connection established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the connecting.py:', err);
  });

module.exports = {
  sequelize,
  Sequelize,
  ...models
};