'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Transactions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      pocket_id: {
        type: Sequelize.INTEGER
      },
      initiator_user_id: {
        type: Sequelize.INTEGER
      },
      type: {
        type: Sequelize.ENUM(
          'Income',
          'Expense'
        ),
        allowNull: false
      },
      amount: {
        type: Sequelize.DECIMAL
      },
      destination_acc: {
        type: Sequelize.STRING
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
      status: {
        type: Sequelize.STRING
      },
      description: {
        type: Sequelize.STRING
      },
      is_business_expense: {
        type: Sequelize.BOOLEAN
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
    await queryInterface.dropTable('Transactions');
  }
};