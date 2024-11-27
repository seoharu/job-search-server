// models/userSkill.js - 사용자-기술스택 N:M 관계 매핑
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
    }
  });

  return UserSkill;
};
