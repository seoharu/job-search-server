// models/userskill.js
const { DataTypes } = require('sequelize');
const crypto = require('crypto');

module.exports = (sequelize) => {
  const UserSkill = sequelize.define('UserSkill', {
    userskill_id: {
      type: DataTypes.STRING(20),
      primaryKey: true
    },
    user_id: {
      type: DataTypes.STRING(20),
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    skill_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    skill_level: {
      type: DataTypes.ENUM('beginner', 'intermediate', 'advanced', 'expert'),
      allowNull: false,
      defaultValue: 'beginner'
    },
    experience_years: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    is_main: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
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
    tableName: 'user_skills',
    indexes: [
      {
        name: 'idx_userskill_user',
        fields: ['user_id']
      }
    ],
    hooks: {
      beforeCreate: async (userSkill) => {
        const hash = crypto.createHash('sha256')
          .update(Date.now().toString() + Math.random().toString())
          .digest('hex');
        userSkill.userskill_id = hash.substring(0, 20);
      }
    }
  });

  return UserSkill;
};