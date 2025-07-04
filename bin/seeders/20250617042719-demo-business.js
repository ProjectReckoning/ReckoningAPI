"use strict";

const bcrypt = require("bcrypt");

module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash("password123", 10);

    // 1. Insert Users
    await queryInterface.bulkInsert(
      "Users",
      [
        {
          id: "6",
          name: "Fernando Manallu",
          phone_number: "62811111111",
          password: hashedPassword,
          pin: "777888",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "7",
          name: "Kevin Wijaya",
          phone_number: "62822222222",
          password: hashedPassword,
          pin: "777888",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "8",
          name: "Amira Manallu",
          phone_number: "62833333333",
          password: hashedPassword,
          pin: "777888",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );

    // 2. Insert Pocket
    await queryInterface.bulkInsert(
      "Pockets",
      [
        {
          id: "6",
          name: "Donut Bahagia",
          type: "business",
          target_nominal: 20000000,
          current_balance: 12500000,
          deadline: new Date("2025-01-01"),
          status: "active",
          owner_user_id: "6",
          icon_name: "food",
          color_hex: "#FDA9FF",
          account_number: "PKT001234567894",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );

    // 3. Insert Pocket Members
    await queryInterface.bulkInsert(
      "PocketMembers",
      [
        {
          user_id: "6",
          pocket_id: "6",
          role: "owner",
          contribution_amount: 6000000,
          joined_at: new Date(),
          is_active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          user_id: "7",
          pocket_id: "6",
          role: "admin",
          contribution_amount: 4000000,
          joined_at: new Date(),
          is_active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          user_id: "8",
          pocket_id: "6",
          role: "spender",
          contribution_amount: 2500000,
          joined_at: new Date(),
          is_active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );


    // 4. Insert Transactions
    await queryInterface.bulkInsert(
      "Transactions",
      [
        {
          id: "29",
          pocket_id: "6",
          initiator_user_id: "6",
          type: "Income",
          amount: 6000000,
          destination_acc: null,
          category: 'topup',
          status: "completed",
          description: "Dana awal untuk beli alat dan bahan",
          is_business_expense: false,
          createdAt: new Date("2024-01-10"),
          updatedAt: new Date("2024-01-10"),
        },
        {
          id: "30",
          pocket_id: "6",
          initiator_user_id: "7",
          type: "Income",
          amount: 4000000,
          destination_acc: null,
          category: 'topup',
          status: "completed",
          description: "Partner ikut urunan modal",
          is_business_expense: false,
          createdAt: new Date("2024-01-12"),
          updatedAt: new Date("2024-01-12"),
        },
        {
          id: "31",
          pocket_id: "6",
          initiator_user_id: "8",
          type: "Income",
          amount: 2500000,
          destination_acc: null,
          category: 'topup',
          status: "completed",
          description: "Tambahan modal bisnis",
          is_business_expense: false,
          createdAt: new Date("2024-01-15"),
          updatedAt: new Date("2024-01-15"),
        },
        {
          id: "32",
          pocket_id: "6",
          initiator_user_id: "6",
          type: "Expense",
          amount: 3000000,
          destination_acc: 'BANK BERSAMA - 1234567890',
          category: 'gaji',
          status: "completed",
          description: "Oven, mixer, loyang, dll",
          is_business_expense: true,
          createdAt: new Date("2024-01-20"),
          updatedAt: new Date("2024-01-20"),
        },
        {
          id: "33",
          pocket_id: "6",
          initiator_user_id: "6",
          type: "Expense",
          amount: 1500000,
          destination_acc: 'BANK BERSAMA - 1234567890',
          category: 'gaji',
          status: "completed",
          description: "Tepung, gula, mentega, dll",
          is_business_expense: true,
          createdAt: new Date("2024-01-25"),
          updatedAt: new Date("2024-01-25"),
        },
        {
          id: "34",
          pocket_id: "6",
          initiator_user_id: "6",
          type: "Income",
          amount: 2000000,
          destination_acc: null,
          category: 'penjualan',
          status: "completed",
          description: "Laku 100 box donat",
          is_business_expense: false,
          createdAt: new Date("2024-02-01"),
          updatedAt: new Date("2024-02-01"),
        },
        {
          id: "35",
          pocket_id: "6",
          initiator_user_id: "7",
          type: "Income",
          amount: 1500000,
          destination_acc: null,
          category: 'penjualan',
          status: "completed",
          description: "Laku di bazar lokal",
          is_business_expense: false,
          createdAt: new Date("2024-02-07"),
          updatedAt: new Date("2024-02-07"),
        },
        {
          id: "36",
          pocket_id: "6",
          initiator_user_id: "8",
          type: "Expense",
          amount: 1000000,
          destination_acc: 'BANK BERSAMA - 1234567890',
          category: 'transfer',
          status: "completed",
          description: "Ads Instagram & TikTok",
          is_business_expense: true,
          createdAt: new Date("2024-02-10"),
          updatedAt: new Date("2024-02-10"),
        },
        {
          id: "37",
          pocket_id: "6",
          initiator_user_id: "6",
          type: "Income",
          amount: 2000000,
          destination_acc: null,
          category: 'penjualan',
          status: "completed",
          description: "Event kampus & pesanan rutin",
          is_business_expense: false,
          createdAt: new Date("2024-02-20"),
          updatedAt: new Date("2024-02-20"),
        },
        {
          id: "38",
          pocket_id: "6",
          initiator_user_id: "7",
          type: "Expense",
          amount: 500000,
          destination_acc: null,
          category: 'gaji',
          status: "completed",
          description: "Transport, listrik, dll",
          is_business_expense: true,
          createdAt: new Date("2024-02-25"),
          updatedAt: new Date("2024-02-25"),
        }
      ],
      {}
    );

    // Mock Saving Account
    await queryInterface.bulkInsert(
      "MockSavingsAccounts",
      [
        {
          id: "6",
          user_id: "6",
          balance: 15750000,
          earmarked_balance: 6000000,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
          account_number: "987654321",
        },
        {
          id: "7",
          user_id: "7",
          balance: 8500000,
          earmarked_balance: 4000000,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
          account_number: "887654321",
        },
        {
          id: "8",
          user_id: "8",
          balance: 12200000,
          earmarked_balance: 2500000,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
          account_number: "787654321",
        },
      ],
      {}
    );

    await queryInterface.bulkInsert(
      "Friendships",
      [
        {
          id: "8",
          user_id_1: "6",
          user_id_2: "7",
          status: "accepted",
          createdAt: new Date("2024-01-05"),
          accepted_at: new Date("2024-01-06"),
          updatedAt: new Date("2024-01-06"),
        },
        {
          id: "9",
          user_id_1: "6",
          user_id_2: "8",
          status: "accepted",
          createdAt: new Date("2024-01-10"),
          accepted_at: new Date("2024-01-11"),
          updatedAt: new Date("2024-01-11"),
        },
      ],
      {}
    );

    await queryInterface.sequelize.query(`
      SELECT setval('public."Transactions_id_seq"', COALESCE((SELECT MAX(id) FROM "Transactions"), 0) + 1, false);
    `);
    await queryInterface.sequelize.query(`
      SELECT setval('public."PocketMembers_id_seq"', COALESCE((SELECT MAX(id) FROM "PocketMembers"), 0) + 1, false);
    `);
    await queryInterface.sequelize.query(`
      SELECT setval('public."Users_id_seq"', COALESCE((SELECT MAX(id) FROM "Users"), 0) + 1, false);
    `);
    await queryInterface.sequelize.query(`
      SELECT setval('public."Pockets_id_seq"', COALESCE((SELECT MAX(id) FROM "Pockets"), 0) + 1, false);
    `);
    await queryInterface.sequelize.query(`
      SELECT setval('public."MockSavingsAccounts_id_seq"', COALESCE((SELECT MAX(id) FROM "MockSavingsAccounts"), 0) + 1, false);
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Transactions", null, {});
    await queryInterface.bulkDelete("PocketMembers", null, {});
    await queryInterface.bulkDelete("Pockets", null, {});
    await queryInterface.bulkDelete('MockSavingsAccounts', null, {});
    await queryInterface.bulkDelete("Users", null, {});
  },
};
