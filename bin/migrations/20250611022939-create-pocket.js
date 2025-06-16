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
        type: Sequelize.ENUM('saving', 'spending', 'business'),
        allowNull: false,
        defaultValue: 'saving'
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
        type: Sequelize.ENUM('active', 'inactive', 'archived'),
        allowNull: false,
        defaultValue: 'active'
      },
      owner_user_id: {
        type: Sequelize.INTEGER
      },
      icon_name: {
        type: Sequelize.STRING
      },
      color_hex: {
        type: Sequelize.STRING
      },
      account_number: {
        type: Sequelize.STRING
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
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Pockets_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Pockets_type";');
  }
};