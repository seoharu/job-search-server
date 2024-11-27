// models/index.js - 모델 관계 설정
const { Sequelize } = require('sequelize');
const config = require('../config/database');

const sequelize = new Sequelize(config);

const models = {
  User: require('./user')(sequelize),
  Company: require('./company')(sequelize),
  Job: require('./job')(sequelize),
  Application: require('./application')(sequelize),
  Bookmark: require('./bookmark')(sequelize),
  Skill: require('./skill')(sequelize),
  JobSkill: require('./jobSkill')(sequelize),
  UserSkill: require('./userSkill')(sequelize)
};

// Define relationships (테이블 간 관계 설정)
// 사용자-지원 관계 (1:N)
models.User.hasMany(models.Application);
models.Application.belongsTo(models.User);

// 채용공고-지원 관계 (1:N)
models.Job.hasMany(models.Application);
models.Application.belongsTo(models.Job);

// 회사-채용공고 관계 (1:N)
models.Company.hasMany(models.Job);
models.Job.belongsTo(models.Company);

// 사용자-북마크-채용공고 관계 (N:M)
models.User.hasMany(models.Bookmark);
models.Bookmark.belongsTo(models.User);
models.Job.hasMany(models.Bookmark);
models.Bookmark.belongsTo(models.Job);

// 채용공고-기술스택 관계 (N:M)
models.Job.belongsToMany(models.Skill, { through: models.JobSkill });
models.Skill.belongsToMany(models.Job, { through: models.JobSkill });

// 사용자-기술스택 관계 (N:M)
models.User.belongsToMany(models.Skill, { through: models.UserSkill });
models.Skill.belongsToMany(models.User, { through: models.UserSkill });

module.exports = models;