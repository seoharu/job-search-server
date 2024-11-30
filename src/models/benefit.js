// 복리후생 모델

module.exports = (sequelize) => {
  const Benefit = sequelize.define('Benefit', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    category: DataTypes.STRING,      // 복리후생 카테고리
    description: DataTypes.TEXT      // 상세 내용
  });
  return Benefit;
};