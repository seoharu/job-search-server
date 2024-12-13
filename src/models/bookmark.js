const { DataTypes } = require('sequelize');
const crypto = require('crypto');

module.exports = (sequelize) => {
 const Bookmark = sequelize.define('Bookmark', {
   bookmark_id: {
     type: DataTypes.STRING(20),
     primaryKey: true,
   },
   user_id: {
     type: DataTypes.STRING(20),
     allowNull: false
   },
   job_id: {
     type: DataTypes.STRING(20),
     allowNull: false
   },
   note: {
     type: DataTypes.TEXT,
     allowNull: true
   },
   notification: {
     type: DataTypes.BOOLEAN,
     allowNull: false,
     defaultValue: false
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
   tableName: 'bookmarks',
   indexes: [
     {
       name: 'idx_bookmark_date',
       fields: ['created_at']
     },
     {
       name: 'user_job',
       unique: true,
       fields: ['user_id', 'job_id']
     }
   ],
   hooks: {
     beforeCreate: async (bookmark) => {
       const hash = crypto.createHash('sha256')
         .update(Date.now().toString() + Math.random().toString())
         .digest('hex');

       bookmark.bookmark_id = hash.substring(0, 20);
     }
   }
 });

 return Bookmark;
};