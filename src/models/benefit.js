// 복리후생 모델
const { DataTypes } = require('sequelize');
const crypto = require('crypto');

module.exports = (sequelize) => {
  const Benefit = sequelize.define('Benefit', {
    benefit_id: {
      type: DataTypes.STRING(20),
      primaryKey: true,
      autoIncrement: true
    },
    company_id: {
     type: DataTypes.STRING(20),
     allowNull: false
   },
   job_id: {
     type: DataTypes.STRING(20),
     allowNull: true
   },
   name: {
     type: DataTypes.STRING(255),
     allowNull: false
   },
   category: {
     type: DataTypes.STRING(100),
     allowNull: true
   },
   description: {
     type: DataTypes.TEXT,
     allowNull: true
   },
   createdAt: {
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
   tableName: 'benefits',
   hooks: {
     beforeCreate: async (benefit) => {
       const hash = crypto.createHash('sha256')
         .update(Date.now().toString() + Math.random().toString())
         .digest('hex');

       benefit.benefit_id = hash.substring(0, 20);
     }
   }
 });

  return Benefit;
};