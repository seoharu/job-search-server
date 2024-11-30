// models/skill.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Skill = sequelize.define('Skill', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      unique: true,        // 기술스택 이름 중복 방지
      allowNull: false     // 필수 필드
    },
    // 추가 필드
    category: {
      type: DataTypes.STRING,  // 예: 'frontend', 'backend', 'devops' 등
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,    // 기술 설명
      allowNull: true
    }
  }, {
    timestamps: true,
    tableName: 'skills',
    indexes: [
      {
        name: 'idx_skill_name',
        fields: ['name']
      }
    ]
  });

  return Skill;
};