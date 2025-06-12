'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class TransactionApproval extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      TransactionApproval.belongsTo(models.User, {
        foreignKey: 'approver_user_id',
        as: 'approver'
      });
      TransactionApproval.belongsTo(models.Transaction, {
        foreignKey: 'transaction_id',
        as: 'transaction'
      });
    }
  }
  TransactionApproval.init({
    status: DataTypes.STRING,
    transaction_id: DataTypes.STRING,
    approver_user_id: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'TransactionApproval',
  });
  return TransactionApproval;
};