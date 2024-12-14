const { DataTypes } = require('sequelize');
const crypto = require('crypto');

module.exports = (sequelize) => {
 const JobSkill = sequelize.define('JobSkill', {
   jobskill_id: {
     type: DataTypes.STRING(20),
     primaryKey: true
   },
   job_id: {
     type: DataTypes.STRING(20),
     allowNull: false
   },
   skill_id: {
     type: DataTypes.STRING(20),
     allowNull: false
   },
   level: {
     type: DataTypes.ENUM('beginner', 'intermediate', 'advanced', 'expert'),
     allowNull: false,
     defaultValue: 'intermediate',
     validate: {
       isIn: [['beginner', 'intermediate', 'advanced', 'expert']]
     }
   },
   is_required: {
     type: DataTypes.BOOLEAN,
     allowNull: false,
     defaultValue: true
   },
   priority: {
     type: DataTypes.INTEGER,
     allowNull: false,
     defaultValue: 1,
     validate: {
       min: 1
     }
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
   tableName: 'job_skills',
   indexes: [
     {
       name: 'idx_jobskill_level',
       fields: ['level']
     },
     {
       name: 'job_skill',
       unique: true,
       fields: ['job_id', 'skill_id']
     }
   ],
   hooks: {
     beforeCreate: async (jobSkill) => {
       const hash = crypto.createHash('sha256')
         .update(Date.now().toString() + Math.random().toString())
         .digest('hex');

       jobSkill.jobskill_id = hash.substring(0, 20);
     }
   }
 });

 return JobSkill;
};