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
        as: 'user'
      });

      PocketMember.belongsTo(models.Pocket, {
        foreignKey: 'pocket_id',
        as: 'pocket'
      });
    }
  }
  PocketMember.init({
    user_id: DataTypes.STRING,
    pocket_id: DataTypes.STRING,
    role: DataTypes.STRING,
    contribution_amount: DataTypes.DECIMAL,
    joined_at: DataTypes.DATE,
    is_active: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'PocketMember',
  });
  return PocketMember;
};