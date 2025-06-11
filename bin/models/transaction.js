'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Transaction extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Transaction diinisiasi oleh User (Many-to-One)
      Transaction.belongsTo(models.User, {
        foreignKey: 'initiator_user_id',
        as: 'initiator'
      });

      // Transaction belongs to Pocket (Many-to-One)
      Transaction.belongsTo(models.Pocket, {
        foreignKey: 'pocket_id',
        as: 'pocket'
      });

      // Transaction has many TransactionApprovals (One-to-Many)
      Transaction.hasMany(models.TransactionApproval, {
        foreignKey: 'transaction_id',
        as: 'approvals'
      });
    }
  }
  Transaction.init({
    type: DataTypes.STRING,
    amount: DataTypes.DECIMAL,
    status: DataTypes.STRING,
    description: DataTypes.STRING,
    mock_core_banking_reference: DataTypes.STRING,
    is_business_expense: DataTypes.BOOLEAN,
    pocket_id: DataTypes.STRING,
    initiator_user_id: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Transaction',
  });
  return Transaction;
};