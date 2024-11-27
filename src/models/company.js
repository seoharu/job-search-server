// models/company.js - 기업 정보 관리
module.exports = (sequelize) => {
  const Company = sequelize.define('Company', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false     // 회사명은 필수
    },
    location: DataTypes.STRING,    // 회사 위치
    size: DataTypes.STRING,        // 회사 규모 (ex: 중소기업, 대기업)
    industry: DataTypes.STRING,    // 산업 분야
    description: DataTypes.TEXT,   // 회사 소개
    logoUrl: DataTypes.STRING      // 회사 로고 URL
  });

  return Company;
};
