const { DataTypes } = require('sequelize');
const crypto = require('crypto');

module.exports = (sequelize) => {
 const Job = sequelize.define('Job', {
   id: {
     type: DataTypes.STRING(20),
     primaryKey: true
   },
   company_id: {
     type: DataTypes.STRING(20),
     allowNull: false
   },
   title: {
     type: DataTypes.STRING(255),
     allowNull: false,
     validate: {
       notEmpty: true
     }
   },
   description: {
     type: DataTypes.TEXT,
     allowNull: false,
     validate: {
       notEmpty: true
     }
   },
   requirements: {
     type: DataTypes.TEXT,
     allowNull: true
   },
   salary: {
     type: DataTypes.STRING(255),
     allowNull: true
   },
   location: {
     type: DataTypes.STRING(255),
     allowNull: true
   },
   employment_type: {
     type: DataTypes.STRING(50),
     allowNull: true
   },
   experience_level: {
     type: DataTypes.STRING(50),
     allowNull: true
   },
   deadline: {
     type: DataTypes.DATE,
     allowNull: false,
     validate: {
       isAfter: new Date().toString()
     }
   },
   status: {
     type: DataTypes.ENUM('active', 'closed'),
     allowNull: false,
     defaultValue: 'active'
   },
   views: {
     type: DataTypes.INTEGER,
     allowNull: false,
     defaultValue: 0,
     validate: {
       min: 0
     }
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
   tableName: 'jobs',
   hooks: {
     beforeCreate: async (job) => {
       const hash = crypto.createHash('sha256')
         .update(Date.now().toString() + Math.random().toString())
         .digest('hex');

       job.id = hash.substring(0, 20);
     }
   }
 });

 return Job;
};