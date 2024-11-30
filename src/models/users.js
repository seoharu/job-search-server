// models/user.js
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
        isEmail: true       // 이메일 형식 검증
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,     // 필수 필드 (Base64로 암호화 예정)
      validate: {
        len: [6, 100]       // 비밀번호 길이 제한
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false      // 필수 필드
    },
    phone: {
      type: DataTypes.STRING,
      validate: {
        is: /^[0-9]{10,11}$/  // 전화번호 형식 검증
      }
    },
    resume: DataTypes.TEXT,    // 이력서 저장 필드
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      defaultValue: 'active'
    },
    lastLoginAt: DataTypes.DATE
  }, {
    timestamps: true,
    tableName: 'users',
    indexes: [
      {
        name: 'idx_user_email',
        fields: ['email']
      }
    ]
  });

  return User;
};