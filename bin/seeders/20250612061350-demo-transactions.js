'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Transactions', [
      {
        id: '1',
        pocket_id: '1',
        initiator_user_id: '1',
        type: 'Topup',
        amount: 500000,
        purpose: 'Tabungan awal untuk liburan',
        status: 'completed',
        description: 'Transfer dari rekening utama',
        is_business_expense: false,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      },
      {
        id: '2',
        pocket_id: '1',
        initiator_user_id: '1',
        type: 'Topup',
        amount: 1000000,
        purpose: 'Bonus gaji januari',
        status: 'completed',
        description: 'Tambahan tabungan liburan',
        is_business_expense: false,
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-01')
      },
      {
        id: '3',
        pocket_id: '2',
        initiator_user_id: '2',
        type: 'Contribution',
        amount: 3000000,
        purpose: 'Kontribusi awal laptop gaming',
        status: 'completed',
        description: 'Setoran pertama untuk laptop',
        is_business_expense: false,
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-10')
      },
      {
        id: '4',
        pocket_id: '2',
        initiator_user_id: '1',
        type: 'Contribution',
        amount: 2500000,
        purpose: 'Ikut patungan laptop',
        status: 'pending',
        description: 'Menunggu persetujuan grup',
        is_business_expense: false,
        createdAt: new Date('2024-02-15'),
        updatedAt: new Date('2024-02-15')
      },
      {
        id: '5',
        pocket_id: '2',
        initiator_user_id: '3',
        type: 'Contribution',
        amount: 3000000,
        purpose: 'Kontribusi laptop gaming',
        status: 'completed',
        description: 'Setoran untuk laptop gaming',
        is_business_expense: false,
        createdAt: new Date('2024-02-20'),
        updatedAt: new Date('2024-02-20')
      },
      {
        id: '6',
        pocket_id: '3',
        initiator_user_id: '3',
        type: 'Topup',
        amount: 2000000,
        purpose: 'Emergency fund buildup',
        status: 'completed',
        description: 'Pembentukan dana darurat',
        is_business_expense: false,
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-01-05')
      },
      {
        id: '7',
        pocket_id: '3',
        initiator_user_id: '3',
        type: 'Topup',
        amount: 1200000,
        purpose: 'Tambahan emergency fund',
        status: 'completed',
        description: 'Penambahan rutin bulanan',
        is_business_expense: false,
        createdAt: new Date('2024-02-05'),
        updatedAt: new Date('2024-02-05')
      },
      {
        id: '8',
        pocket_id: '4',
        initiator_user_id: '4',
        type: 'Contribution',
        amount: 400000,
        purpose: 'Arisan bulan Januari',
        status: 'completed',
        description: 'Setoran arisan keluarga',
        is_business_expense: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: '9',
        pocket_id: '4',
        initiator_user_id: '2',
        type: 'Contribution',
        amount: 400000,
        purpose: 'Arisan bulan Januari',
        status: 'completed',
        description: 'Ikut arisan keluarga',
        is_business_expense: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: '10',
        pocket_id: '4',
        initiator_user_id: '5',
        type: 'Contribution',
        amount: 400000,
        purpose: 'Arisan bulan Januari',
        status: 'completed',
        description: 'Setoran arisan keluarga',
        is_business_expense: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: '11',
        pocket_id: '5',
        initiator_user_id: '5',
        type: 'Contribution',
        amount: 10000000,
        purpose: 'Modal awal investasi',
        status: 'completed',
        description: 'Investasi saham blue chip',
        is_business_expense: false,
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-20')
      },
      {
        id: '12',
        pocket_id: '5',
        initiator_user_id: '5',
        type: 'Topup',
        amount: 2500000,
        purpose: 'DCA bulanan saham',
        status: 'completed',
        description: 'Dollar cost averaging',
        is_business_expense: false,
        createdAt: new Date('2024-02-20'),
        updatedAt: new Date('2024-02-20')
      },
      {
        id: '13',
        pocket_id: '2',
        initiator_user_id: '2',
        type: 'Withdrawal',
        amount: 5000000,
        purpose: 'Pembelian laptop gaming',
        status: 'pending',
        description: 'Withdrawal untuk beli laptop',
        is_business_expense: false,
        createdAt: new Date('2024-03-01'),
        updatedAt: new Date('2024-03-01')
      }
    ], {});

    await queryInterface.sequelize.query(`
      SELECT setval('public."Transactions_id_seq"', COALESCE((SELECT MAX(id) FROM "Transactions"), 0) + 1, false);
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Transactions', null, {});
  }
};