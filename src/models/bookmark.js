// models/bookmark.js - 북마크/관심공고 관리
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Bookmark = sequelize.define('Bookmark', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    createdAt: {  // 북마크 생성 시간
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false
    },
    note: DataTypes.TEXT,              // 북마크 메모
    notification: {                    // 알림 설정
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    timestamps: true,
    tableName: 'bookmarks',
    indexes: [
      {
        name: 'idx_bookmark_date',
        fields: ['createdAt']
      }
    ]
  });

  return Bookmark;
};