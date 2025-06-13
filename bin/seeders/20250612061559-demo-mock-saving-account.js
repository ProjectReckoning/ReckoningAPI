'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('MockSavingsAccounts', [
      {
        id: '1',
        user_id: '1',
        balance: 15750000,
        earmarked_balance: 1500000, // Dana yang sudah dialokasikan ke pockets
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        account_number: 'SA001234567890'
      },
      {
        id: '2',
        user_id: '2',
        balance: 8500000,
        earmarked_balance: 3800000,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        account_number: 'SA001234567891'
      },
      {
        id: '3',
        user_id: '3',
        balance: 12200000,
        earmarked_balance: 6200000,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        account_number: 'SA001234567892'
      },
      {
        id: '4',
        user_id: '4',
        balance: 6400000,
        earmarked_balance: 400000,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        account_number: 'SA001234567893'
      },
      {
        id: '5',
        user_id: '5',
        balance: 25000000,
        earmarked_balance: 12900000,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        account_number: 'SA001234567894'
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('MockSavingsAccounts', null, {});
  }
};
