"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "Pockets",
      [
        {
          id: "1",
          name: "Tabungan Liburan Bali",
          type: "savings",
          target_nominal: 5000000,
          current_balance: 1500000,
          deadline: new Date("2024-12-31"),
          status: "active",
          owner_user_id: "1",
          icon_name: "beach",
          color_hex: "#FF6B6B",
          account_number: "PKT001234567890",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "2",
          name: "Patungan Laptop Gaming",
          type: "savings",
          target_nominal: 15000000,
          current_balance: 8500000,
          deadline: new Date("2024-08-15"),
          status: "active",
          owner_user_id: "2",
          icon_name: "laptop",
          color_hex: "#4ECDC4",
          account_number: "PKT001234567891",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "3",
          name: "Emergency Fund",
          type: "savings",
          target_nominal: 10000000,
          current_balance: 3200000,
          deadline: null,
          status: "active",

          owner_user_id: "3",
          icon_name: "shield",
          color_hex: "#45B7D1",
          account_number: "PKT001234567892",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "4",
          name: "Arisan Keluarga",
          type: "savings",
          target_nominal: 2000000,
          current_balance: 1200000,
          deadline: new Date("2024-07-01"),
          status: "active",

          owner_user_id: "4",
          icon_name: "family",
          color_hex: "#96CEB4",
          account_number: "PKT001234567893",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "5",
          name: "Donut Business",
          type: "business",
          target_nominal: 20000000,
          current_balance: 12500000,
          deadline: new Date("2025-01-01"),
          status: "active",
          owner_user_id: "5",
          icon_name: "trending_up",
          color_hex: "#FFEAA7",
          account_number: "PKT001234567894",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );

    await queryInterface.sequelize.query(`
      SELECT setval('public."Pockets_id_seq"', COALESCE((SELECT MAX(id) FROM "Pockets"), 0) + 1, false);
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Pockets", null, {});
  },
};
