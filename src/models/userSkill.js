// models/userSkill.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserSkill = sequelize.define('UserSkill', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    level: {
      type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'), // 기술 숙련도
      defaultValue: 'beginner'
    },
    // 추가 필드
    yearsOfExperience: {
      type: DataTypes.FLOAT,    // 해당 기술 경력 년수
      defaultValue: 0
    },
    lastUsed: {
      type: DataTypes.DATE,     // 마지막으로 사용한 날짜
      defaultValue: DataTypes.NOW
    },
    isMainSkill: {
      type: DataTypes.BOOLEAN,  // 주요 기술 여부
      defaultValue: false
    }
  }, {
    timestamps: true,
    tableName: 'user_skills',
    indexes: [
      {
        name: 'idx_user_skill_level',
        fields: ['level']
      }
    ]
  });

  return UserSkill;
};