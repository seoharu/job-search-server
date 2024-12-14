const { DataTypes } = require('sequelize');
const crypto = require('crypto');

module.exports = (sequelize) => {
 const Skill = sequelize.define('Skill', {
   skill_id: {
     type: DataTypes.STRING(20),
     primaryKey: true
   },
   name: {
     type: DataTypes.STRING(50),
     allowNull: false,
     unique: true,
     validate: {
       notEmpty: true
     }
   },
   category: {
     type: DataTypes.STRING(30),
     allowNull: false,
     validate: {
       notEmpty: true
     }
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
   tableName: 'skills',
   indexes: [
     {
       name: 'idx_skill_name',
       fields: ['name']
     }
   ],
   hooks: {
     beforeCreate: async (skill) => {
       const hash = crypto.createHash('sha256')
         .update(Date.now().toString() + Math.random().toString())
         .digest('hex');

       skill.skill_id = hash.substring(0, 20);
     }
   }
 });

 return Skill;
};