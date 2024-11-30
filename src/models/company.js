const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Company = sequelize.define('Company', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,     // 회사명 필수
      unique: true
    },
    location: {  // 회사 위치
      type: DataTypes.STRING,
      allowNull: true
    },
    size: {   // 회사 규모
      type: DataTypes.ENUM('startup', 'small', 'medium', 'large', 'enterprise'),
      allowNull: true
    },
    industry: {
      type: DataTypes.STRING,   // 산업 분야
      allowNull: true,
      validate: {
        notEmpty: true
      }
    },
    description: {
      type: DataTypes.TEXT,   // 회사 소개
      allowNull: true
    },
    logoUrl: {
      type: DataTypes.STRING,   // 회사 로고 URL
      validate: {
        isUrl: true
      }
    },
    foundedYear: {
      type: DataTypes.INTEGER,     // 설립연도
      validate: {
        min: 1800,
        max: new Date().getFullYear()
      }
    },
    employeeCount: {
      type: DataTypes.INTEGER,   // 직원 수
      validate: {
        min: 1
      }
    },
    website: {
      type: DataTypes.STRING,    // 회사 웹사이트
      validate: {
        isUrl: true
      }
    },
    benefits: DataTypes.TEXT,    // 회사 복리후생

    // 추가 필드들
    contactEmail: {
      type: DataTypes.STRING,
      validate: {
        isEmail: true
      }
    },
    companyRegistrationNumber: {  // 사업자등록번호
      type: DataTypes.STRING,
      unique: true,
      validate: {
        is: /^[0-9]{10}$/  // 10자리 숫자
      }
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'blacklisted'),
      defaultValue: 'active'
    },
    ratingAverage: {  // 회사 평점
      type: DataTypes.FLOAT,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 5
      }
    },
    reviewCount: {  // 리뷰 수
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    activeJobCount: {  // 현재 진행중인 채용공고 수
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    timestamps: true,
    tableName: 'companies',
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
        fields: ['ratingAverage']
      }
    ],
    scopes: {
      active: {
        where: {
          status: 'active'
        }
      },
      withActiveJobs: {
        where: {
          status: 'active',
          activeJobCount: {
            [Op.gt]: 0
          }
        }
      }
    }
  });

  return Company;
};