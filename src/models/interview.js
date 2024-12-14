const { DataTypes } = require('sequelize');
const crypto = require('crypto');

module.exports = (sequelize) => {
  const Interview = sequelize.define('Interview', {
    interview_id: {
      type: DataTypes.STRING(20),
      primaryKey: true
    },
    user_id: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    company_id: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    job_id: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('scheduled','completed','canceled','no_show'),
      allowNull: false,
      defaultValue: 'scheduled'
    },
    difficulty: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5
      }
    },
    process: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true  // 빈 문자열 방지
      }
    },
    question: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true  // 빈 문자열 방지
      }
    },
    result: {
      type: DataTypes.ENUM('pass','fail','pending'),
      allowNull: false,
      defaultValue: 'pending'
    },
    experience: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    interview_date: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isAfter: new Date().toString()  // 현재 시간 이후인지 검증
      }
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,  // 최소 1분
        max: 480  // 최대 8시간
      }
    },
    interview_type: {
      type: DataTypes.ENUM('online','offline','phone'),
      allowNull: false
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: false,
    tableName: 'Interviews',
    indexes: [
      {
        name: 'idx_interview_result',
        fields: ['result']
      },
      {
        name: 'interview',
        unique: true,
        fields: ['job_id', 'user_id']
      }
    ],
    hooks: {
      beforeCreate: async (interview) => {
        const hash = crypto.createHash('sha256')
          .update(Date.now().toString() + Math.random().toString())
          .digest('hex');

        interview.interview_id = hash.substring(0, 20);
      }
    }
  });


  Interview.associate = (models) => {
    Interview.belongsTo(models.Job, { foreignKey: 'job_id', as: 'job' }); // 관계 설정
  };

  return Interview;
};