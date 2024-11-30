// 면접 리뷰 테이블
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Interview = sequelize.define('Interview', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    difficulty: {  // 난이도
      type: DataTypes.INTEGER,
      validate: {
        min: 1,
        max: 5
      }
    },
    process: {  // 면접 과정
      type: DataTypes.TEXT,
      allowNull: false
    },
    question: {  // 면접 질문
      type: DataTypes.TEXT,
      allowNull: false
    },
    result: {    // 합격/불합격
      type: DataTypes.ENUM('pass', 'fail', 'pending'),
      allowNull: false
    },
    experience: DataTypes.TEXT,   // 면접 후기
    interviewDate: DataTypes.DATE,      // 면접 일자
    duration: DataTypes.INTEGER,        // 면접 시간 (분)
    interviewType: {                    // 면접 종류
      type: DataTypes.ENUM('online', 'offline', 'phone'),
      allowNull: false
    }
  }, {
    timestamps: true,
    tableName: 'interviews',
    indexes: [
      {
        name: 'idx_interview_result',
        fields: ['result']
      }
    ]
  });

  return Interview;
};
