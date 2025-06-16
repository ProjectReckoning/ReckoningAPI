'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PocketMember extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      PocketMember.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'members'
      });

      PocketMember.belongsTo(models.Pocket, {
        foreignKey: 'pocket_id',
        as: 'pocket'
      });
    }
  }
  PocketMember.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: DataTypes.INTEGER,
    pocket_id: DataTypes.INTEGER,
    role: DataTypes.ENUM('owner','admin', 'viewer','spender'),
    contribution_amount: DataTypes.DECIMAL,
    joined_at: DataTypes.DATE,
    is_active: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'PocketMember',
  });
  return PocketMember;
};