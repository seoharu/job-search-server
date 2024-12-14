const { DataTypes } = require('sequelize');
const crypto = require('crypto');

module.exports = (sequelize) => {
  const Application = sequelize.define('Application', {
    application_id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    user_id: { // 지원자 ID
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    job_id: { // 채용공고 ID
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'reviewed', 'accepted', 'rejected'),
      defaultValue: 'pending',
      allowNull: false,
    },
    resume_version: { // 제출된 이력서 버전
      type: DataTypes.STRING,
      allowNull: false,
    },
    cover_letter: { // 자기소개서
      type: DataTypes.TEXT,
      allowNull: true,
    },
    appliedAt: { // 지원 일시
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    reviewed_at: DataTypes.DATE, // 검토 일시
    reviewed_comment: DataTypes.TEXT, // 검토자 코멘트
    interview_date: DataTypes.DATE, // 면접 예정 일시
  }, {
    timestamps: true, // createdAt과 updatedAt 자동 관리 활성화
    tableName: 'Applications',
    indexes: [
      {
        name: 'idx_application_status',
        fields: ['status'],
      },
      {
        name: 'idx_application_date',
        fields: ['appliedAt'],
      },
      {
        name: 'idx_application_user', // 사용자별 조회를 위한 인덱스
        fields: ['user_id'],
      },
      {
        name: 'idx_application_job', // 채용공고별 조회를 위한 인덱스
        fields: ['job_id'],
      },
    ],
    hooks: {
      beforeCreate: async (application) => {
        // 현재 시간 + 랜덤값으로 해시 생성
        const hash = crypto.createHash('sha256')
          .update(Date.now().toString() + Math.random().toString())
          .digest('hex');

        // 20자리로 자르기 (VARCHAR(20)에 맞춤)
        application.application_id = hash.substring(0, 20);
      },
    },
  });

  // 관계 설정
  Application.associate = (models) => {
    Application.belongsTo(models.User, { foreignKey: 'user_id', targetKey: 'user_id' });
  };

  return Application;
};
