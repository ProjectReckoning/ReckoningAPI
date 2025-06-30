'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('AutoBudgetings', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER
      },
      pocket_id: {
        type: Sequelize.INTEGER
      },
      recurring_amount: {
        type: Sequelize.INTEGER
      },
      treshold_amount: {
        type: Sequelize.INTEGER
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'inactive'
      },
      category: {
        type: Sequelize.ENUM(
          'penjualan',
          'pembelian',
          'topup',
          'withdraw',
          'gaji',
          'transfer',
          'autobudget',
          'lainnya'
        )
      },
      is_active: {
        type: Sequelize.BOOLEAN
      },
      schedule_type: {
        type: Sequelize.STRING
      },
      schedule_value: {
        type: Sequelize.INTEGER
      },
      next_run_date: {
        type: Sequelize.DATE
      },
      last_triggered_at: {
        type: Sequelize.DATE
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
    await queryInterface.dropTable('AutoBudgetings');
  }
};