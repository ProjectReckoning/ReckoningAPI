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
    }
  }
  TransactionApproval.init({
    status: DataTypes.STRING,
    comment: DataTypes.STRING,
    transaction_id: DataTypes.STRING,
    approver_user_id: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'TransactionApproval',
  });
  return TransactionApproval;
};