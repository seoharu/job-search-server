// models/bookmark.js - 북마크/관심공고 관리
module.exports = (sequelize) => {
  const Bookmark = sequelize.define('Bookmark', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    createdAt: {
      type: DataTypes.DATE,          // 북마크 생성 시간
      defaultValue: DataTypes.NOW
    }
  });

  return Bookmark;
};