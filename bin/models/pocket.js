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

      // Pocket memiliki banyak User sebagai member (Many-to-Many through PocketMember)
      Pocket.belongsToMany(models.User, {
        through: models.PocketMember,
        foreignKey: 'pocket_id',
        otherKey: 'user_id',
        as: 'members'
      });

      Pocket.hasMany(models.PocketMember, {
        foreignKey: 'pocket_id',
        as: 'pocketMembers'
      });

      // Pocket has many Transactions (One-to-Many)
      Pocket.hasMany(models.Transaction, {
        foreignKey: 'pocket_id',
        as: 'transactions'
      });

      // Pocket has many PaymentPlanners (One-to-Many)
      Pocket.hasMany(models.AutoBudgeting, {
        foreignKey: 'pocket_id',
        as: 'autoBudgetings'
      });

    }
  }
  Pocket.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: DataTypes.STRING,
    type: DataTypes.ENUM('saving', 'spending', 'business'),
    target_nominal: DataTypes.DECIMAL,
    current_balance: DataTypes.DECIMAL,
    deadline: DataTypes.DATE,
    status: DataTypes.ENUM('active', 'inactive', 'archived'),
    owner_user_id: DataTypes.INTEGER,
    icon_name: DataTypes.STRING,
    color_hex: DataTypes.STRING,
    account_number: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'Pocket',
  });
  return Pocket;
};