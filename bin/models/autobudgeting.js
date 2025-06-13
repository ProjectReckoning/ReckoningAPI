'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class AutoBudgeting extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      AutoBudgeting.belongsTo(models.User,{
        foreignKey: 'user_id',
        as: 'user'
      })

      AutoBudgeting.belongsTo(models.Pocket,{
        foreignKey: 'pocket_id',
        as: 'pocket'
      })
    }
  }
  AutoBudgeting.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: DataTypes.INTEGER,
    pocket_id: DataTypes.INTEGER,
    recurring_amount: DataTypes.INTEGER,
    treshold_amount: DataTypes.INTEGER,
    status: DataTypes.ENUM('active', 'inactive', 'paused'),
    is_active: DataTypes.BOOLEAN,
    schedule_type: DataTypes.STRING,
    schedule_value: DataTypes.INTEGER,
    next_run_date: DataTypes.DATE,
    last_triggered_at: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'AutoBudgeting',
  });
  return AutoBudgeting;
};