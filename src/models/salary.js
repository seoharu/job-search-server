const { DataTypes } = require('sequelize');
const crypto = require('crypto');

module.exports = (sequelize) => {
  const Salary = sequelize.define('Salary', {
    salary_id: {
      type: DataTypes.STRING(20),
      primaryKey: true
    },
    job_id: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,  // 1:1 관계이므로 unique 유지
      references: {
        model: 'Jobs',
        key: 'id'
      }
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0  // 급여는 음수가 될 수 없음
      }
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: sequelize.literal('YEAR(CURRENT_TIMESTAMP)'),
      validate: {
        min: 1900,  // 합리적인 연도 범위 설정
        max: 9999
      }
    },
    position: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    experience: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0  // 경력은 음수가 될 수 없음
      }
    },
    min_salary: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,  // 최소 급여는 음수가 될 수 없음
        customValidate(value) {
          if (this.max_salary && value > this.max_salary) {
            throw new Error('최소 급여는 최대 급여보다 클 수 없습니다');
          }
        }
      }
    },
    max_salary: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0  // 최대 급여는 음수가 될 수 없음
      }
    },
    currency: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'KRW',
      validate: {
        isIn: [['KRW', 'USD', 'EUR', 'JPY']]  // 허용된 통화 단위만 사용
      }
    },
    salary_type: {
      type: DataTypes.ENUM('yearly', 'monthly'),
      allowNull: false,
      defaultValue: 'yearly'
    },
    negotiable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    benefits: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: false,
    tableName: 'salaries',
    indexes: [
      {
        name: 'idx_interview_result',
        fields: ['result']
      },
      {
        name: 'idx_interview_status',
        fields: ['status']
      }
    ],
    hooks: {
      beforeCreate: async (salary) => {
        const hash = crypto.createHash('sha256')
          .update(Date.now().toString() + Math.random().toString())
          .digest('hex');

        salary.salary_id = hash.substring(0, 20);
      }
    }
  });

  return Salary;
};