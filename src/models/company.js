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
     allowNull: false
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
       fields: ['rating_average']
     }
   ],
   hooks: {
     beforeCreate: async (company) => {
       const hash = crypto.createHash('sha256')
         .update(Date.now().toString() + Math.random().toString())
         .digest('hex');

       company.company_id = hash.substring(0, 20);
     }
   }
 });

 return Company;
};