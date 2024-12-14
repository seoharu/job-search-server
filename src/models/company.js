const { DataTypes } = require('sequelize');
const crypto = require('crypto');

module.exports = (sequelize) => {
  const Company = sequelize.define('Company', {
    company_id: {
      type: DataTypes.STRING(20),
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    company_registration_number: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    size: {
      type: DataTypes.ENUM('startup', 'small', 'medium', 'large', 'enterprise'),
      allowNull: false,
      defaultValue: 'small'
    },
    industry: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    logo_url: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    foundedYear: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    website: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    employee_count: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    benefits: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    contact_email: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'blacklisted'),
      allowNull: false,
      defaultValue: 'active'
    },
    rating_average: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0
    },
    review_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    active_job_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
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
    timestamps: true, // createdAt 및 updatedAt 자동 관리
    tableName: 'Companies',
    indexes: [
      {
        name: 'idx_company_name',
        fields: ['name']
      },
      {
        name: 'idx_company_industry',
        fields: ['industry']
      },
      {
        name: 'idx_company_location',
        fields: ['location']
      },
      {
        name: 'idx_company_status',
        fields: ['status']
      },
      {
        name: 'idx_company_rating',
        fields: ['rating_average']
      }
    ],
    hooks: {
      beforeCreate: async (company) => {
        company.company_id = crypto.randomUUID().substring(0, 20);
      }
    }
  });

  Company.associate = (models) => {
    Company.hasMany(models.Job, { foreignKey: 'company_id', as: 'jobs' }); // Job과 관계 설정
  };

  return Company;
};
