'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class BusinessSplitRule extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  BusinessSplitRule.init({
    split_percentage: DataTypes.DECIMAL,
    is_active: DataTypes.BOOLEAN,
    effective_date: DataTypes.DATE,
    pocket_id: DataTypes.STRING,
    user_id: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'BusinessSplitRule',
  });
  return BusinessSplitRule;
};