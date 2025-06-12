'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Transactions', [
      {
        id: 'trans-001',
        pocket_id: 'pocket-001',
        initiator_user_id: 'user-001',
        type: 'deposit',
        amount: 500000,
        purpose: 'Tabungan awal untuk liburan',
        status: 'completed',
        description: 'Transfer dari rekening utama',
        is_business_expense: false,
        timestamp: new Date('2024-01-15')
      },
      {
        id: 'trans-002',
        pocket_id: 'pocket-001',
        initiator_user_id: 'user-001',
        type: 'deposit',
        amount: 1000000,
        purpose: 'Bonus gaji januari',
        status: 'completed',
        description: 'Tambahan tabungan liburan',
        is_business_expense: false,
        timestamp: new Date('2024-02-01')
      },
      {
        id: 'trans-003',
        pocket_id: 'pocket-002',
        initiator_user_id: 'user-002',
        type: 'deposit',
        amount: 3000000,
        purpose: 'Kontribusi awal laptop gaming',
        status: 'completed',
        description: 'Setoran pertama untuk laptop',
        is_business_expense: false,
        timestamp: new Date('2024-01-10')
      },
      {
        id: 'trans-004',
        pocket_id: 'pocket-002',
        initiator_user_id: 'user-001',
        type: 'deposit',
        amount: 2500000,
        purpose: 'Ikut patungan laptop',
        status: 'pending',
        description: 'Menunggu persetujuan grup',
        is_business_expense: false,
        timestamp: new Date('2024-02-15')
      },
      {
        id: 'trans-005',
        pocket_id: 'pocket-002',
        initiator_user_id: 'user-003',
        type: 'deposit',
        amount: 3000000,
        purpose: 'Kontribusi laptop gaming',
        status: 'completed',
        description: 'Setoran untuk laptop gaming',
        is_business_expense: false,
        timestamp: new Date('2024-02-20')
      },
      {
        id: 'trans-006',
        pocket_id: 'pocket-003',
        initiator_user_id: 'user-003',
        type: 'deposit',
        amount: 2000000,
        purpose: 'Emergency fund buildup',
        status: 'completed',
        description: 'Pembentukan dana darurat',
        is_business_expense: false,
        timestamp: new Date('2024-01-05')
      },
      {
        id: 'trans-007',
        pocket_id: 'pocket-003',
        initiator_user_id: 'user-003',
        type: 'deposit',
        amount: 1200000,
        purpose: 'Tambahan emergency fund',
        status: 'completed',
        description: 'Penambahan rutin bulanan',
        is_business_expense: false,
        timestamp: new Date('2024-02-05')
      },
      {
        id: 'trans-008',
        pocket_id: 'pocket-004',
        initiator_user_id: 'user-004',
        type: 'deposit',
        amount: 400000,
        purpose: 'Arisan bulan Januari',
        status: 'completed',
        description: 'Setoran arisan keluarga',
        is_business_expense: false,
        timestamp: new Date('2024-01-01')
      },
      {
        id: 'trans-009',
        pocket_id: 'pocket-004',
        initiator_user_id: 'user-002',
        type: 'deposit',
        amount: 400000,
        purpose: 'Arisan bulan Januari',
        status: 'completed',
        description: 'Ikut arisan keluarga',
        is_business_expense: false,
        timestamp: new Date('2024-01-01')
      },
      {
        id: 'trans-010',
        pocket_id: 'pocket-004',
        initiator_user_id: 'user-005',
        type: 'deposit',
        amount: 400000,
        purpose: 'Arisan bulan Januari',
        status: 'completed',
        description: 'Setoran arisan keluarga',
        is_business_expense: false,
        timestamp: new Date('2024-01-01')
      },
      {
        id: 'trans-011',
        pocket_id: 'pocket-005',
        initiator_user_id: 'user-005',
        type: 'deposit',
        amount: 10000000,
        purpose: 'Modal awal investasi',
        status: 'completed',
        description: 'Investasi saham blue chip',
        is_business_expense: false,
        timestamp: new Date('2024-01-20')
      },
      {
        id: 'trans-012',
        pocket_id: 'pocket-005',
        initiator_user_id: 'user-005',
        type: 'deposit',
        amount: 2500000,
        purpose: 'DCA bulanan saham',
        status: 'completed',
        description: 'Dollar cost averaging',
        is_business_expense: false,
        timestamp: new Date('2024-02-20')
      },
      {
        id: 'trans-013',
        pocket_id: 'pocket-002',
        initiator_user_id: 'user-002',
        type: 'withdraw',
        amount: 5000000,
        purpose: 'Pembelian laptop gaming',
        status: 'pending',
        description: 'Withdrawal untuk beli laptop',
        is_business_expense: false,
        timestamp: new Date('2024-03-01')
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Transactions', null, {});
  }
};