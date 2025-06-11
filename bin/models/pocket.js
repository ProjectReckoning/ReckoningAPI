'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Pocket extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Pocket dimiliki oleh User (Many-to-One)
      Pocket.belongsTo(models.User, {
        foreignKey: 'owner_user_id',
        as: 'owner'
      });

      // Pocket belongs to Business (Many-to-One)
      Pocket.belongsTo(models.Business, {
        foreignKey: 'business_id',
        as: 'business'
      });

      // Pocket memiliki banyak User sebagai member (Many-to-Many through PocketMember)
      Pocket.belongsToMany(models.User, {
        through: models.PocketMember,
        foreignKey: 'pocket_id',
        otherKey: 'user_id',
        as: 'members'
      });

      // Pocket has many Transactions (One-to-Many)
      Pocket.hasMany(models.Transaction, {
        foreignKey: 'pocket_id',
        as: 'transactions'
      });

      // Pocket has many PaymentPlanners (One-to-Many)
      Pocket.hasMany(models.PaymentPlanner, {
        foreignKey: 'pocket_id',
        as: 'paymentPlanners'
      });

      // Pocket has many BusinessSplitRules (One-to-Many)
      Pocket.hasMany(models.BusinessSplitRule, {
        foreignKey: 'pocket_id',
        as: 'businessSplitRules'
      });
    }
  }
  Pocket.init({
    name: DataTypes.STRING,
    type: DataTypes.STRING,
    target_nominal: DataTypes.DECIMAL,
    current_balance: DataTypes.DECIMAL,
    deadline: DataTypes.DATE,
    status: DataTypes.STRING,
    owner_user_id: DataTypes.STRING,
    business_id: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Pocket',
  });
  return Pocket;
};