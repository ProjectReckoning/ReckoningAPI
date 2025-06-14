'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('PocketMembers', [
      // Pocket 1 (Tabungan Liburan Bali) - Solo pocket
      {
        user_id: '1',
        pocket_id: '1',
        role: 'owner',
        contribution_amount: 1500000,
        joined_at: new Date(),
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      
      // Pocket 2 (Patungan Laptop Gaming) - Group pocket
      {
        user_id: '2',
        pocket_id: '2',
        role: 'owner',
        contribution_amount: 3000000,
        joined_at: new Date(),
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        user_id: '1',
        pocket_id: '2',
        role: 'viewer',
        contribution_amount: 2500000,
        joined_at: new Date(),
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        user_id: '3',
        pocket_id: '2',
        role: 'viewer',
        contribution_amount: 3000000,
        joined_at: new Date(),
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      
      // Pocket 3 (Emergency Fund) - Solo pocket
      {
        user_id: '3',
        pocket_id: '3',
        role: 'owner',
        contribution_amount: 3200000,
        joined_at: new Date(),
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      
      // Pocket 4 (Arisan Keluarga) - Group pocket
      {
        user_id: '4',
        pocket_id: '4',
        role: 'owner',
        contribution_amount: 400000,
        joined_at: new Date(),
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        user_id: '2',
        pocket_id: '4',
        role: 'viewer',
        contribution_amount: 400000,
        joined_at: new Date(),
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        user_id: '5',
        pocket_id: '4',
        role: 'viewer',
        contribution_amount: 400000,
        joined_at: new Date(),
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      
      // Pocket 5 (Investasi Saham) - Solo pocket
      {
        user_id: '5',
        pocket_id: '5',
        role: 'owner',
        contribution_amount: 12500000,
        joined_at: new Date(),
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ], {});

    await queryInterface.sequelize.query(`
      SELECT setval('public."PocketMembers_id_seq"', COALESCE((SELECT MAX(id) FROM "PocketMembers"), 0) + 1, false);
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('PocketMembers', null, {});
  }
};
