'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Friendships', [
      {
        id: '1',
        user_id_1: '1',
        user_id_2: '2',
        status: 'accepted',
        createdAt: new Date('2024-01-05'),
        accepted_at: new Date('2024-01-06'),
        updatedAt: new Date('2024-01-06')
      },
      {
        id: '2',
        user_id_1: '1',
        user_id_2: '3',
        status: 'accepted',
        createdAt: new Date('2024-01-10'),
        accepted_at: new Date('2024-01-11'),
        updatedAt: new Date('2024-01-11')
      },
      {
        id: '3',
        user_id_1: '2',
        user_id_2: '3',
        status: 'accepted',
        createdAt: new Date('2024-01-15'),
        accepted_at: new Date('2024-01-16'),
        updatedAt: new Date('2024-01-16')
      },
      {
        id: '4',
        user_id_1: '2',
        user_id_2: '4',
        status: 'accepted',
        createdAt: new Date('2024-01-20'),
        accepted_at: new Date('2024-01-21'),
        updatedAt: new Date('2024-01-21')
      },
      {
        id: '5',
        user_id_1: '4',
        user_id_2: '5',
        status: 'accepted',
        createdAt: new Date('2024-01-25'),
        accepted_at: new Date('2024-01-26'),
        updatedAt: new Date('2024-01-26')
      },
      {
        id: '6',
        user_id_1: '3',
        user_id_2: '5',
        status: 'pending',
        createdAt: new Date('2024-02-01'),
        accepted_at: null,
        updatedAt: new Date('2024-02-01')
      },
      {
        id: '7',
        user_id_1: '1',
        user_id_2: '4',
        status: 'rejected',
        createdAt: new Date('2024-01-30'),
        accepted_at: null,
        updatedAt: new Date('2024-01-30')
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Friendships', null, {});
  }
};