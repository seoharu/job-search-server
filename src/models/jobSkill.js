// models/jobSkill.js - 채용공고-기술스택 N:M 관계 매핑

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const JobSkill = sequelize.define('JobSkill', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    level: {                            // 요구 숙련도
      type: DataTypes.ENUM('beginner', 'intermediate', 'advanced', 'expert'),
      defaultValue: 'intermediate'
    },
    isRequired: {                       // 필수 스킬 여부
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    priority: {                         // 우선순위
      type: DataTypes.INTEGER,
      defaultValue: 1
    }
  }, {
    timestamps: true,
    tableName: 'job_skills',
    indexes: [
      {
        name: 'idx_jobskill_level',
        fields: ['level']
      }
    ]
  });

  return JobSkill;
};