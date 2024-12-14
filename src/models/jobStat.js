const { DataTypes } = require('sequelize');
const crypto = require('crypto');

module.exports = (sequelize) => {
 const JobStat = sequelize.define('JobStat', {
   jobstat_id: {
     type: DataTypes.STRING(20),
     primaryKey: true
   },
   job_id: {
     type: DataTypes.STRING(20),
     allowNull: false,
     unique: true
   },
   views: {
     type: DataTypes.INTEGER,
     allowNull: false,
     defaultValue: 0,
     validate: {
       min: 0
     }
   },
   applications: {
     type: DataTypes.INTEGER,
     allowNull: false,
     defaultValue: 0,
     validate: {
       min: 0
     }
   },
   bookmarks: {
     type: DataTypes.INTEGER,
     allowNull: false,
     defaultValue: 0,
     validate: {
       min: 0
     }
   },
   daily_views: {
     type: DataTypes.INTEGER,
     allowNull: false,
     defaultValue: 0,
     validate: {
       min: 0
     }
   },
   weekly_views: {
     type: DataTypes.INTEGER,
     allowNull: false,
     defaultValue: 0,
     validate: {
       min: 0
     }
   },
   application_rate: {
     type: DataTypes.FLOAT,
     allowNull: false,
     defaultValue: 0,
     validate: {
       min: 0,
       max: 100
     }
   },
   conversion_rate: {
     type: DataTypes.DECIMAL(5, 2),
     allowNull: false,
     defaultValue: 0,
     validate: {
       min: 0,
       max: 100
     }
   },
   active_applications: {
     type: DataTypes.INTEGER,
     allowNull: false,
     defaultValue: 0,
     validate: {
       min: 0
     }
   },
   completed_applications: {
     type: DataTypes.INTEGER,
     allowNull: false,
     defaultValue: 0,
     validate: {
       min: 0
     }
   },
   last_updated: {
     type: DataTypes.DATE,
     allowNull: false,
     defaultValue: DataTypes.NOW
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
   tableName: 'job_stats',
   indexes: [
     {
       name: 'idx_job_views',
       fields: ['views']
     },
     {
       name: 'idx_job_applications',
       fields: ['applications']
     }
   ],
   hooks: {
     beforeCreate: async (jobStat) => {
       const hash = crypto.createHash('sha256')
         .update(Date.now().toString() + Math.random().toString())
         .digest('hex');

       jobStat.jobstat_id = hash.substring(0, 20);
     }
   }
 });

 return JobStat;
};