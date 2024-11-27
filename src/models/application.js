// models/application.js - 지원내역 관리
module.exports = (sequelize) => {
  const Application = sequelize.define('Application', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'reviewed', 'accepted', 'rejected'), // 지원 상태
      defaultValue: 'pending'
    },
    resumeVersion: DataTypes.STRING,  // 제출된 이력서 버전
    coverLetter: DataTypes.TEXT,      // 자기소개서
    appliedAt: {
      type: DataTypes.DATE,           // 지원 일시
      defaultValue: DataTypes.NOW
    }
  });

  return Application;
};