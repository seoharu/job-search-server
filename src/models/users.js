const { DataTypes } = require('sequelize');
const crypto = require('crypto');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    user_id: {
      type: DataTypes.STRING(20),
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      unique: true,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [6, 100],
      },
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        is: /^[0-9]{10,11}$/,
      },
    },
    resume: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      allowNull: false,
      defaultValue: 'active',
    },
    last_login_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    timestamps: true, // createdAt과 updatedAt 자동 관리 활성화
    tableName: 'Users',
    // underscored: true, // createdAt -> created_at, updatedAt -> updated_at으로 매핑
    indexes: [
      {
        name: 'idx_user_email',
        fields: ['email'],
      },
    ],
    hooks: {
      beforeCreate: async (user) => {
        const hash = crypto.createHash('sha256')
          .update(Date.now().toString() + Math.random().toString())
          .digest('hex');

        user.user_id = hash.substring(0, 20);
      },
    },
  });

  User.associate = (models) => {
    User.hasMany(models.Application, { foreignKey: 'user_id', sourceKey: 'user_id' });
  };

  return User;
};



