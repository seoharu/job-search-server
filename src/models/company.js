// models/company.js - 기업 정보 관리

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Company = sequelize.define('Company', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,     // 회사명 필수
      unique: true
    },
    location: {  // 회사 위치
      type: DataTypes.STRING,
      allowNull: true
    },
    size: {   // 회사 규모
      type: DataTypes.ENUM('startup', 'small', 'medium', 'large', 'enterprise'),
      allowNull: true
    },
    industry: DataTypes.STRING,   // 산업 분야
    description: DataTypes.TEXT,   // 회사 소개
    logoUrl: DataTypes.STRING,   // 회사 로고 URL
    foundedYear: DataTypes.INTEGER,     // 설립연도
    employeeCount: DataTypes.INTEGER,   // 직원 수
    website: DataTypes.STRING,          // 회사 웹사이트
    benefits: DataTypes.TEXT            // 회사 복리후생
  }, {
    timestamps: true,
    tableName: 'companies',
    indexes: [
      {
        name: 'idx_company_name',
        fields: ['name']
      },
      {
        name: 'idx_company_industry',
        fields: ['industry']
      }
    ]
  });

  return Company;
};