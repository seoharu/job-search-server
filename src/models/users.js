const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    email: {
      type: DataTypes.STRING,
      unique: true,         // 이메일 중복 방지
      allowNull: false,     // 필수 필드
      validate: {
        isEmail: true      // 이메일 형식 검증
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false      // 필수 필드 (Base64로 암호화 예정)
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false     // 필수 필드
    },
    phone: DataTypes.STRING,
    resume: DataTypes.TEXT  // 이력서 저장 필드
  });

  return User;
};