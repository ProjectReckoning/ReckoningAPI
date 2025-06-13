'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('TransactionApprovals', [
      {
        id: '1',
        transaction_id: '4',
        approver_user_id: '2',
        status: 'approved',
        createdAt: new Date('2024-02-16'),
        updatedAt: new Date('2024-02-16')
      },
      {
        id: '2',
        transaction_id: '4',
        approver_user_id: '3',
        status: 'pending',
        createdAt: new Date('2024-02-15'),
        updatedAt: new Date('2024-02-15')
      },
      {
        id: '3',
        transaction_id: '13',
        approver_user_id: '1',
        status: 'approved',
        createdAt: new Date('2024-03-02'),
        updatedAt: new Date('2024-03-02')
      },
      {
        id: '4',
        transaction_id: '13',
        approver_user_id: '3',
        status: 'pending',
        createdAt: new Date('2024-03-01'),
        updatedAt: new Date('2024-03-01')
      }
    ], {});

    await queryInterface.sequelize.query(`
      SELECT setval('public."TransactionApprovals_id_seq"', COALESCE((SELECT MAX(id) FROM "TransactionApprovals"), 0) + 1, false);
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('TransactionApprovals', null, {});
  }
};