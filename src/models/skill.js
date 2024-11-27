// models/skill.js - 기술스택 관리
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
    }
  });

  return Skill;
};