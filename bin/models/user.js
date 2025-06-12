"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      User.hasMany(models.Pocket, {
        foreignKey: "owner_user_id",
        as: "ownedPockets",
      });

      User.hasMany(models.MockSavingAccount, {
        foreignKey: "user_id",
        as: "savingAccount",
      });

      User.belongsToMany(models.Pocket, {
        through: models.PocketMember,
        foreignKey: "user_id",
        otherKey: "pocket_id",
        as: "memberPockets",
      });

      User.hasMany(models.Transaction, {
        foreignKey: "initiator_user_id",
        as: "transactions",
      });

      User.hasMany(models.TransactionApproval, {
        foreignKey: "approver_user_id",
        as: "transactionApprovals",
      });

      User.hasMany(models.Notification, {
        foreignKey: "user_id",
        as: "notifications",
      });

      User.hasMany(models.AutoBudgeting, {
        foreignKey: "user_id",
        as: "autoBudgetings",
      });

      User.belongsToMany(models.User, {
        through: models.UserFriend,
        foreignKey: "user_id_1",
        otherKey: "user_id_2",
        as: "friends",
      });
    }
  }
  User.init(
    {
      name: DataTypes.STRING,
      phone_number: DataTypes.STRING,
      password: DataTypes.STRING,
      PIN: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "User",
    }
  );
  return User;
};
