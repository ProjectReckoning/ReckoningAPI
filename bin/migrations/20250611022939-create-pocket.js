'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Pockets', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING
      },
      type: {
        type: Sequelize.STRING
      },
      target_nominal: {
        type: Sequelize.DECIMAL
      },
      current_balance: {
        type: Sequelize.DECIMAL
      },
      deadline: {
        type: Sequelize.DATE
      },
      status: {
        type: Sequelize.STRING
      },
      owner_user_id: {
        type: Sequelize.INTEGER
      },
      business_id: {
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Pockets');
  }
};