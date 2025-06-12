'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Pockets', [
      {
        id: 'pocket-001',
        name: 'Tabungan Liburan Bali',
        type: 'savings',
        target_nominal: 5000000,
        current_balance: 1500000,
        deadline: new Date('2024-12-31'),
        status: 'active',
        create_at: new Date(),
        owner_user_id: 'user-001',
        icon_name: 'beach',
        color_hex: '#FF6B6B',
        account_number: 'PKT001234567890'
      },
      {
        id: 'pocket-002',
        name: 'Patungan Laptop Gaming',
        type: 'group_savings',
        target_nominal: 15000000,
        current_balance: 8500000,
        deadline: new Date('2024-08-15'),
        status: 'active',
        create_at: new Date(),
        owner_user_id: 'user-002',
        icon_name: 'laptop',
        color_hex: '#4ECDC4',
        account_number: 'PKT001234567891'
      },
      {
        id: 'pocket-003',
        name: 'Emergency Fund',
        type: 'emergency',
        target_nominal: 10000000,
        current_balance: 3200000,
        deadline: null,
        status: 'active',
        create_at: new Date(),
        owner_user_id: 'user-003',
        icon_name: 'shield',
        color_hex: '#45B7D1',
        account_number: 'PKT001234567892'
      },
      {
        id: 'pocket-004',
        name: 'Arisan Keluarga',
        type: 'group_payment',
        target_nominal: 2000000,
        current_balance: 1200000,
        deadline: new Date('2024-07-01'),
        status: 'active',
        create_at: new Date(),
        owner_user_id: 'user-004',
        icon_name: 'family',
        color_hex: '#96CEB4',
        account_number: 'PKT001234567893'
      },
      {
        id: 'pocket-005',
        name: 'Investasi Saham',
        type: 'investment',
        target_nominal: 20000000,
        current_balance: 12500000,
        deadline: new Date('2025-01-01'),
        status: 'active',
        create_at: new Date(),
        owner_user_id: 'user-005',
        icon_name: 'trending_up',
        color_hex: '#FFEAA7',
        account_number: 'PKT001234567894'
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Pockets', null, {});
  }
};