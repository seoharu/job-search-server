// models/salary.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Salary = sequelize.define('Salary', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    amount: {
      type: DataTypes.INTEGER,      // 연봉액
      allowNull: false
    },
    year: {
      type: DataTypes.INTEGER,      // 연도
      allowNull: false,
      defaultValue: new Date().getFullYear()
    },
    position: DataTypes.STRING,     // 직급/직책
    experience: DataTypes.INTEGER,  // 경력 연차

    // 추가 필드들
    minSalary: DataTypes.INTEGER,   // 최소 연봉
    maxSalary: DataTypes.INTEGER,   // 최대 연봉
    currency: {
      type: DataTypes.STRING,       // 통화 단위
      defaultValue: 'KRW'
    },
    salaryType: {
      type: DataTypes.ENUM('yearly', 'monthly'), // 급여 지급 단위
      defaultValue: 'yearly'
    },
    negotiable: {
      type: DataTypes.BOOLEAN,      // 연봉 협의 가능 여부
      defaultValue: false
    },
    benefits: DataTypes.TEXT,       // 추가 수당/혜택 정보
    description: DataTypes.TEXT     // 급여 관련 추가 설명
  }, {
    timestamps: true,
    tableName: 'salaries'
  });

  return Salary;
};