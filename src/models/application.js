const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Application = sequelize.define('Application', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'reviewed', 'accepted', 'rejected'),
      defaultValue: 'pending',
      allowNull: false
    },
    resumeVersion: {  // 제출된 이력서 버전
      type: DataTypes.STRING,
      allowNull: false
    },
    coverLetter: {  // 자기소개서
      type: DataTypes.TEXT,
      allowNull: true
    },
    appliedAt: {    // 지원 일시
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false
    },
    reviewedAt: DataTypes.DATE,         // 검토 일시
    reviewerComment: DataTypes.TEXT,     // 검토자 코멘트
    interviewDate: DataTypes.DATE        // 면접 예정 일시
  }, {
    timestamps: true,
    tableName: 'applications',
    indexes: [
      {
        name: 'idx_application_status',
        fields: ['status']
      },
      {
        name: 'idx_application_date',
        fields: ['appliedAt']
      }
    ]
  });

  return Application;
};