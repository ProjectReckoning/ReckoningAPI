'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PaymentPlanner extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  PaymentPlanner.init({
    threshold_amount: DataTypes.DECIMAL,
    top_up_amount: DataTypes.DECIMAL,
    frequency: DataTypes.STRING,
    is_active: DataTypes.BOOLEAN,
    last_triggered_at: DataTypes.DATE,
    status: DataTypes.STRING,
    pocket_id: DataTypes.STRING,
    user_id: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'PaymentPlanner',
  });
  return PaymentPlanner;
};