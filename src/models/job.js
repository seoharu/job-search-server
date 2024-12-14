const { DataTypes } = require('sequelize');
const crypto = require('crypto');

module.exports = (sequelize) => {
  const Job = sequelize.define('Job', {
    job_id: { // 명확한 기본 키 이름 사용
      type: DataTypes.STRING(20),
      primaryKey: true,
    },
    company_id: { // 외래 키
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    requirements: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    salary: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    employment_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    experience_level: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    deadline: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isAfter: new Date().toString(),
      },
    },
    status: {
      type: DataTypes.ENUM('active', 'closed'),
      allowNull: false,
      defaultValue: 'active',
    },
    views: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    // 기술 스택 필드 추가
    tech_stack: {
      type: DataTypes.JSON,  // or DataTypes.ARRAY(DataTypes.STRING)
      allowNull: true,
    },
    // salary 필드를 범위검색이 가능하도록 수정
    salary_min: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    salary_max: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  }, {
    timestamps: true, // createdAt과 updatedAt 자동 관리 활성화
    tableName: 'Jobs',
    hooks: {
      beforeCreate: async (job) => {
        const hash = crypto.createHash('sha256')
          .update(Date.now().toString() + Math.random().toString())
          .digest('hex');

        job.job_id = hash.substring(0, 20);
      },
    },
  });

  Job.associate = (models) => {
    Job.belongsTo(models.Company, { foreignKey: 'company_id', as: 'Company' });
    Job.hasMany(models.Interview, { foreignKey: 'job_id', as: 'interviews' }); // 관계 설정
  };

  return Job;
};
