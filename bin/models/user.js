'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      User.hasMany(models.Business,{
        foreignKey: 'created_by_user_id',
        as: 'businesses'
      });

      User.belongsToMany(models.Business, {
        through: models.BusinessMember,
        foreignKey: 'user_id',
        otherKey: 'business_id',
        as: 'businesses'
      });

      User.belongsToMany(models.Pocket,{
        through: models.PocketMember,
        foreignKey: 'user_id',
        otherKey: 'pocket_id',
        as: 'pockets'
      });

      User.hasMany(models.Transaction,{
        foreignKey: 'initiator_user_id',
        as: 'transactions'
      });

      User.hasMany(models.TransactionApproval,{
        foreignKey: 'approver_user_id',
        as: 'transactionApprovals'
      });

      User.hasMany(models.Notification,{
        foreignKey: 'user_id',
        as: 'notifications'
      });

      User.hasMany(models.PaymentPlanner,{
        foreignKey: 'user_id',
        as: 'paymentPlanners'
      });

      User.hasMany(models.BusinessSplitRule,{
        foreignKey: 'user_id',
        as: 'businessSplitRules'
      })
    }
  }
  User.init({
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    phone_number: DataTypes.STRING,
    password: DataTypes.STRING,
    PIN: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};