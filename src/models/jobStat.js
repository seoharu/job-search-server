// models/jobStat.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const JobStat = sequelize.define('JobStat', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    views: {
      type: DataTypes.INTEGER,      // 조회수
      defaultValue: 0,
      allowNull: false
    },
    applications: {
      type: DataTypes.INTEGER,      // 지원자 수
      defaultValue: 0,
      allowNull: false
    },
    bookmarks: {
      type: DataTypes.INTEGER,      // 북마크 수
      defaultValue: 0,
      allowNull: false
    },

    // 추가 통계 필드들
    dailyViews: {
      type: DataTypes.INTEGER,      // 일일 조회수
      defaultValue: 0
    },
    weeklyViews: {
      type: DataTypes.INTEGER,      // 주간 조회수
      defaultValue: 0
    },
    applicationRate: {
      type: DataTypes.FLOAT,        // 지원률 (조회수 대비)
      defaultValue: 0
    },
    activeApplications: {
      type: DataTypes.INTEGER,      // 현재 진행 중인 지원
      defaultValue: 0
    },
    completedApplications: {
      type: DataTypes.INTEGER,      // 완료된 지원
      defaultValue: 0
    },
    lastUpdated: {
      type: DataTypes.DATE,         // 마지막 통계 업데이트 시간
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: true,
    tableName: 'job_stats',
    indexes: [
      {
        name: 'idx_job_views',
        fields: ['views']
      },
      {
        name: 'idx_job_applications',
        fields: ['applications']
      }
    ]
  });

  return JobStat;
};