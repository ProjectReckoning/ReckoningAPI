'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Business extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Business dibuat oleh User (Many-to-One)
      Business.belongsTo(models.User, {
        foreignKey: 'created_by_user_id',
        as: 'creator'
      });

      // Business memiliki banyak User sebagai member (Many-to-Many through BusinessMember)
      Business.belongsToMany(models.User, {
        through: models.BusinessMember,
        foreignKey: 'business_id',
        otherKey: 'user_id',
        as: 'members'
      });

      // Business has many Pockets (One-to-Many)
      Business.hasMany(models.Pocket, {
        foreignKey: 'business_id',
        as: 'pocket'
      });
    }
  }
  Business.init({
    name: DataTypes.STRING,
    description: DataTypes.STRING,
    status: DataTypes.STRING,
    created_by_user_id: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Business',
  });
  return Business;
};