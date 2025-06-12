'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class MockSavingsAccount extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      MockSavingsAccount.belongsTo(models.User,{
        foreignKey: 'user_id',
        as: 'user'
      })
    }
  }
  MockSavingsAccount.init({
    balance: DataTypes.DECIMAL,
    earmarked_balance: DataTypes.DECIMAL,
    user_id: DataTypes.INTEGER,
    account_number: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'MockSavingsAccount',
  });
  return MockSavingsAccount;
};