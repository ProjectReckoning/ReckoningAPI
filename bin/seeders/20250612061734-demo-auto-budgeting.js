'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('AutoBudgetings', [
      {
        id: '1',
        user_id: '1',
        pocket_id: '1',
        recurring_amount: 500000,
        treshold_amount: null,
        status: 'active',
        is_active: true,
        schedule_type: 'monthly',
        schedule_value: 1, // tanggal 1 setiap bulan
        next_run_date: new Date('2024-04-01'),
        last_triggered_at: new Date('2024-03-01'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: '2',
        user_id: '3',
        pocket_id: '3',
        recurring_amount: 1000000,
        treshold_amount: null,
        status: 'active',
        is_active: true,
        schedule_type: 'monthly',
        schedule_value: 5, // tanggal 5 setiap bulan
        next_run_date: new Date('2024-04-05'),
        last_triggered_at: new Date('2024-03-05'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: '3',
        user_id: '5',
        pocket_id: '5',
        recurring_amount: null,
        treshold_amount: 5000000, // jika balance > 5jt, auto invest
        status: 'active',
        is_active: true,
        schedule_type: 'threshold',
        schedule_value: null,
        next_run_date: new Date('2024-04-01'),
        last_triggered_at: new Date('2024-02-20'),
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15')
      },
      {
        id: '4',
        user_id: '4',
        pocket_id: '4',
        recurring_amount: 400000,
        treshold_amount: null,
        status: 'inactive',
        is_active: false,
        schedule_type: 'monthly',
        schedule_value: 1,
        next_run_date: new Date('2024-05-01'),
        last_triggered_at: new Date('2024-01-01'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: '5',
        user_id: '2',
        pocket_id: '2',
        recurring_amount: 1000000,
        treshold_amount: null,
        status: 'active',
        is_active: true,
        schedule_type: 'weekly',
        schedule_value: 1, // setiap hari Senin
        next_run_date: new Date('2024-03-11'),
        last_triggered_at: new Date('2024-03-04'),
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-01')
      }
    ], {});

    await queryInterface.sequelize.query(`
      SELECT setval('public."AutoBudgetings_id_seq"', COALESCE((SELECT MAX(id) FROM "AutoBudgetings"), 0) + 1, false);
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('AutoBudgetings', null, {});
  }
};