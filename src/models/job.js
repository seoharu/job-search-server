
// models/job.js - 채용공고 관리
module.exports = (sequelize) => {
  const Job = sequelize.define('Job', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false     // 공고 제목 필수
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false     // 공고 내용 필수
    },
    requirements: DataTypes.TEXT,   // 자격요건
    salary: DataTypes.STRING,       // 급여 정보
    location: DataTypes.STRING,     // 근무지 위치
    employmentType: DataTypes.STRING, // 고용형태 (정규직, 계약직 등)
    experienceLevel: DataTypes.STRING, // 경력 요구사항
    deadline: DataTypes.DATE,       // 지원 마감일
    status: {
      type: DataTypes.ENUM('active', 'closed'),  // 공고 상태
      defaultValue: 'active'
    },
    views: {
      type: DataTypes.INTEGER,      // 조회수
      defaultValue: 0
    }
  });

  return Job;
};