'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Notifications', [
      {
        id: 'notif-001',
        user_id: 'user-001',
        type: 'transaction',
        message: 'Transaksi deposit Rp 500.000 ke Tabungan Liburan Bali berhasil',
        is_read: true,
        created_at: new Date('2024-01-15')
      },
      {
        id: 'notif-002',
        user_id: 'user-002',
        type: 'approval',
        message: 'Transaksi deposit dari Ahmad Rizki memerlukan persetujuan Anda',
        is_read: false,
        created_at: new Date('2024-02-15')
      },
      {
        id: 'notif-003',
        user_id: 'user-003',
        type: 'approval',
        message: 'Transaksi deposit dari Ahmad Rizki memerlukan persetujuan Anda',
        is_read: false,
        created_at: new Date('2024-02-15')
      },
      {
        id: 'notif-004',
        user_id: 'user-001',
        type: 'pocket',
        message: 'Selamat! Target 30% tabungan liburan Bali tercapai',
        is_read: true,
        created_at: new Date('2024-02-01')
      },
      {
        id: 'notif-005',
        user_id: 'user-004',
        type: 'reminder',
        message: 'Jangan lupa setoran arisan bulan ini ya!',
        is_read: false,
        created_at: new Date('2024-03-01')
      },
      {
        id: 'notif-006',
        user_id: 'user-005',
        type: 'investment',
        message: 'Portofolio saham Anda naik 5% bulan ini',
        is_read: false,
        created_at: new Date('2024-02-28')
      },
      {
        id: 'notif-007',
        user_id: 'user-002',
        type: 'withdrawal',
        message: 'Permintaan withdrawal laptop gaming menunggu persetujuan',
        is_read: false,
        created_at: new Date('2024-03-01')
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Notifications', null, {});
  }
};