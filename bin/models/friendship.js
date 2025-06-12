'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Friendship extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Friendship.belongsTo(models.User,{
        foreignKey: 'user_id_1',
        as: 'user1'
      })

      Friendship.belongsTo(models.User,{
        foreignKey: 'user_id_2',
        as: 'user2'
      })
    }
  }
  Friendship.init({
    status: DataTypes.ENUM('pending', 'accepted', 'rejected'),
    user_id_1: DataTypes.INTEGER,
    user_id_2: DataTypes.INTEGER,
    accepted_at: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Friendship',
  });
  return Friendship;
};