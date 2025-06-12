'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('AutoBudgeting', [
      {
        id: 'auto-001',
        user_id: 'user-001',
        pocket_id: 'pocket-001',
        recurring_amount: 500000,
        threshold_amount: null,
        status: 'active',
        is_active: true,
        schedule_type: 'monthly',
        schedule_value: 1, // tanggal 1 setiap bulan
        next_run_date: new Date('2024-04-01'),
        last_triggered_at: new Date('2024-03-01'),
        created_at: new Date('2024-01-01')
      },
      {
        id: 'auto-002',
        user_id: 'user-003',
        pocket_id: 'pocket-003',
        recurring_amount: 1000000,
        threshold_amount: null,
        status: 'active',
        is_active: true,
        schedule_type: 'monthly',
        schedule_value: 5, // tanggal 5 setiap bulan
        next_run_date: new Date('2024-04-05'),
        last_triggered_at: new Date('2024-03-05'),
        created_at: new Date('2024-01-01')
      },
      {
        id: 'auto-003',
        user_id: 'user-005',
        pocket_id: 'pocket-005',
        recurring_amount: null,
        threshold_amount: 5000000, // jika balance > 5jt, auto invest
        status: 'active',
        is_active: true,
        schedule_type: 'threshold',
        schedule_value: null,
        next_run_date: new Date('2024-04-01'),
        last_triggered_at: new Date('2024-02-20'),
        created_at: new Date('2024-01-15')
      },
      {
        id: 'auto-004',
        user_id: 'user-004',
        pocket_id: 'pocket-004',
        recurring_amount: 400000,
        threshold_amount: null,
        status: 'paused',
        is_active: false,
        schedule_type: 'monthly',
        schedule_value: 1,
        next_run_date: new Date('2024-05-01'),
        last_triggered_at: new Date('2024-01-01'),
        created_at: new Date('2024-01-01')
      },
      {
        id: 'auto-005',
        user_id: 'user-002',
        pocket_id: 'pocket-002',
        recurring_amount: 1000000,
        threshold_amount: null,
        status: 'active',
        is_active: true,
        schedule_type: 'weekly',
        schedule_value: 1, // setiap hari Senin
        next_run_date: new Date('2024-03-11'),
        last_triggered_at: new Date('2024-03-04'),
        created_at: new Date('2024-02-01')
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('AutoBudgeting', null, {});
  }
};