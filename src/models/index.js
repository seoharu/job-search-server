const { Sequelize } = require('sequelize');

// 데이터베이스 연결 설정
const config = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: "WSD03",
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || '10013',
  dialect: "mysql", // MySQL 사용
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};

// Sequelize 인스턴스 생성
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    pool: config.pool,
  }
);

// 모델 불러오기
const User = require('./users')(sequelize);
const Job = require('./job')(sequelize);
const Application = require('./application')(sequelize);
const Interview = require('./interview')(sequelize);
const Bookmark = require('./bookmark')(sequelize);
const UserSkill = require('./userSkill')(sequelize);
const Company = require('./company')(sequelize);

// 관계 설정
User.hasMany(Application, { foreignKey: 'user_id', sourceKey: 'user_id' });
Application.belongsTo(User, { foreignKey: 'user_id', targetKey: 'user_id' });

User.hasMany(Bookmark, { foreignKey: 'user_id', sourceKey: 'user_id' });
Bookmark.belongsTo(User, { foreignKey: 'user_id', targetKey: 'user_id' });

Job.hasMany(Application, { foreignKey: 'job_id', sourceKey: 'job_id', as: 'interviews' });
Application.belongsTo(Job, { foreignKey: 'job_id', targetKey: 'job_id' });

Interview.belongsTo(Job, { foreignKey: 'job_id', targetKey: 'job_id', as: 'job' });
Interview.belongsTo(User, { foreignKey: 'user_id', targetKey: 'user_id' }); // User와 Interview 관계 설정

// 관계 설정
User.hasMany(UserSkill);
UserSkill.belongsTo(User);

Interview.belongsTo(User, { foreignKey: 'user_id', targetKey: 'user_id' }); // User와 Interview 관계 설정

// Company와 Job 관계 설정
Company.hasMany(Job, { foreignKey: 'company_id', sourceKey: 'company_id', as: 'jobs' });
Job.belongsTo(Company, { foreignKey: 'company_id', targetKey: 'company_id', as: 'Company' });



// DB 객체 생성
const db = {
  sequelize,
  Sequelize,
  User,
  Job,
  Company,
  Application,
  Interview,
  Bookmark,
};

module.exports = db;
