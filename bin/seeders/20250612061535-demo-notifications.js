'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Notifications', [
      {
        id: '1',
        user_id: '1',
        type: 'transaction',
        message: 'Transaksi deposit Rp 500.000 ke Tabungan Liburan Bali berhasil',
        is_read: true,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15')
      },
      {
        id: '2',
        user_id: '2',
        type: 'approval',
        message: 'Transaksi deposit dari Ahmad Rizki memerlukan persetujuan Anda',
        is_read: false,
        createdAt: new Date('2024-02-15'),
        updatedAt: new Date('2024-02-15')
      },
      {
        id: '3',
        user_id: '3',
        type: 'approval',
        message: 'Transaksi deposit dari Ahmad Rizki memerlukan persetujuan Anda',
        is_read: false,
        createdAt: new Date('2024-02-15'),
        updatedAt: new Date('2024-02-15')
      },
      {
        id: '4',
        user_id: '1',
        type: 'reminder',
        message: 'Selamat! Target 30% tabungan liburan Bali tercapai',
        is_read: true,
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-01')
      },
      {
        id: '5',
        user_id: '4',
        type: 'reminder',
        message: 'Jangan lupa setoran arisan bulan ini ya!',
        is_read: false,
        createdAt: new Date('2024-03-01'),
        updatedAt: new Date('2024-03-01')
      },
      {
        id: '6',
        user_id: '5',
        type: 'alert',
        message: 'Portofolio saham Anda naik 5% bulan ini',
        is_read: false,
        createdAt: new Date('2024-02-28'),
        updatedAt: new Date('2024-02-28')
      },
      {
        id: '7',
        user_id: '2',
        type: 'approval',
        message: 'Permintaan withdrawal laptop gaming menunggu persetujuan',
        is_read: false,
        createdAt: new Date('2024-03-01'),
        updatedAt: new Date('2024-03-01')
      }
    ], {});

    await queryInterface.sequelize.query(`
      SELECT setval('public."Notifications_id_seq"', COALESCE((SELECT MAX(id) FROM "Notifications"), 0) + 1, false);
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Notifications', null, {});
  }
};