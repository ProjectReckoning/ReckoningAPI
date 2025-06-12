'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('TransactionApprovals', [
      {
        id: 'approval-001',
        transaction_id: 'trans-004',
        approver_user_id: 'user-002',
        status: 'approved',
        timestamp: new Date('2024-02-16')
      },
      {
        id: 'approval-002',
        transaction_id: 'trans-004',
        approver_user_id: 'user-003',
        status: 'pending',
        timestamp: new Date('2024-02-15')
      },
      {
        id: 'approval-003',
        transaction_id: 'trans-013',
        approver_user_id: 'user-001',
        status: 'approved',
        timestamp: new Date('2024-03-02')
      },
      {
        id: 'approval-004',
        transaction_id: 'trans-013',
        approver_user_id: 'user-003',
        status: 'pending',
        timestamp: new Date('2024-03-01')
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('TransactionApprovals', null, {});
  }
};