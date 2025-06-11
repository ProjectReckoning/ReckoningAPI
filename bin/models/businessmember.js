'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class BusinessMember extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      BusinessMember.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });

      BusinessMember.belongsTo(models.Business, {
        foreignKey: 'business_id',
        as: 'business'
      });
    }
  }
  BusinessMember.init({
    user_id: DataTypes.STRING,
    business_id: DataTypes.STRING,
    role: DataTypes.STRING,
    joined_at: DataTypes.DATE,
    is_active: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'BusinessMember',
  });
  return BusinessMember;
};