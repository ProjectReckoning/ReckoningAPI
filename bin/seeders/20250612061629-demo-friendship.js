'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Friendship', [
      {
        id: 'friend-001',
        user_id_1: 'user-001',
        user_id_2: 'user-002',
        status: 'accepted',
        created_at: new Date('2024-01-05'),
        accepted_at: new Date('2024-01-06')
      },
      {
        id: 'friend-002',
        user_id_1: 'user-001',
        user_id_2: 'user-003',
        status: 'accepted',
        created_at: new Date('2024-01-10'),
        accepted_at: new Date('2024-01-11')
      },
      {
        id: 'friend-003',
        user_id_1: 'user-002',
        user_id_2: 'user-003',
        status: 'accepted',
        created_at: new Date('2024-01-15'),
        accepted_at: new Date('2024-01-16')
      },
      {
        id: 'friend-004',
        user_id_1: 'user-002',
        user_id_2: 'user-004',
        status: 'accepted',
        created_at: new Date('2024-01-20'),
        accepted_at: new Date('2024-01-21')
      },
      {
        id: 'friend-005',
        user_id_1: 'user-004',
        user_id_2: 'user-005',
        status: 'accepted',
        created_at: new Date('2024-01-25'),
        accepted_at: new Date('2024-01-26')
      },
      {
        id: 'friend-006',
        user_id_1: 'user-003',
        user_id_2: 'user-005',
        status: 'pending',
        created_at: new Date('2024-02-01'),
        accepted_at: null
      },
      {
        id: 'friend-007',
        user_id_1: 'user-001',
        user_id_2: 'user-004',
        status: 'rejected',
        created_at: new Date('2024-01-30'),
        accepted_at: null
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Friendship', null, {});
  }
};