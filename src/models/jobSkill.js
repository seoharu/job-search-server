// models/jobSkill.js - 채용공고-기술스택 N:M 관계 매핑
module.exports = (sequelize) => {
  const JobSkill = sequelize.define('JobSkill', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    }
  });

  return JobSkill;
};
