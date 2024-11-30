// models/index.js
const { Sequelize } = require('sequelize');
const config = require('../config/database');

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
models.User.hasMany(models.Application, { foreignKey: 'userId', as: 'applications' });
models.Application.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });

// 채용공고-지원 관계 (1:N)
models.Job.hasMany(models.Application, { foreignKey: 'jobId', as: 'applications' });
models.Application.belongsTo(models.Job, { foreignKey: 'jobId', as: 'job' });

// 회사-채용공고 관계 (1:N)
models.Company.hasMany(models.Job, { foreignKey: 'companyId', as: 'jobs' });
models.Job.belongsTo(models.Company, { foreignKey: 'companyId', as: 'company' });

// 사용자-북마크-채용공고 관계 (N:M)
models.User.belongsToMany(models.Job, {
  through: models.Bookmark,
  foreignKey: 'userId',
  as: 'bookmarkedJobs'
});
models.Job.belongsToMany(models.User, {
  through: models.Bookmark,
  foreignKey: 'jobId',
  as: 'bookmarkedByUsers'
});

// 채용공고-기술스택 관계 (N:M)
models.Job.belongsToMany(models.Skill, {
  through: models.JobSkill,
  foreignKey: 'jobId',
  as: 'skills'
});
models.Skill.belongsToMany(models.Job, {
  through: models.JobSkill,
  foreignKey: 'skillId',
  as: 'jobs'
});

// 사용자-기술스택 관계 (N:M)
models.User.belongsToMany(models.Skill, {
  through: models.UserSkill,
  foreignKey: 'userId',
  as: 'skills'
});
models.Skill.belongsToMany(models.User, {
  through: models.UserSkill,
  foreignKey: 'skillId',
  as: 'users'
});

// 채용공고-혜택 관계 (1:N)
models.Job.hasMany(models.Benefit, { foreignKey: 'jobId', as: 'benefits' });
models.Benefit.belongsTo(models.Job, { foreignKey: 'jobId', as: 'job' });

// 채용공고-면접 관계 (1:N)
models.Job.hasMany(models.Interview, { foreignKey: 'jobId', as: 'interviews' });
models.Interview.belongsTo(models.Job, { foreignKey: 'jobId', as: 'job' });

// 사용자-면접 관계 (1:N)
models.User.hasMany(models.Interview, { foreignKey: 'userId', as: 'interviews' });
models.Interview.belongsTo(models.User, { foreignKey: 'userId', as: 'interviewer' });

// 채용공고-통계 관계 (1:1)
models.Job.hasOne(models.JobStat, { foreignKey: 'jobId', as: 'statistics' });
models.JobStat.belongsTo(models.Job, { foreignKey: 'jobId', as: 'job' });

// 채용공고-급여 관계 (1:1)
models.Job.hasOne(models.Salary, { foreignKey: 'jobId', as: 'salaryInfo' });
models.Salary.belongsTo(models.Job, { foreignKey: 'jobId', as: 'job' });

// 회사-면접 관계 (1:N)
models.Company.hasMany(models.Interview, { foreignKey: 'companyId', as: 'interviews' });
models.Interview.belongsTo(models.Company, { foreignKey: 'companyId', as: 'company' });

// 에러 처리를 위한 이벤트 리스너 추가
sequelize.authenticate()
  .then(() => {
    console.log('Database connection established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

  // 모델과 sequelize 인스턴스 export
module.exports = {
  sequelize,
  Sequelize,
  ...models
};
