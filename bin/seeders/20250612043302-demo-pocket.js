"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "Pockets",
      [
        {
          id: "1",
          name: "Tabungan Liburan Bali",
          type: "saving",
          target_nominal: 5000000,
          current_balance: 1500000,
          deadline: new Date("2024-12-31"),
          status: "active",
          owner_user_id: "1",
          icon_name: "pocket",
          color_hex: "#FF8500",
          account_number: "PKT001234567890",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "2",
          name: "Patungan Laptop Gaming",
          type: "saving",
          target_nominal: 15000000,
          current_balance: 8500000,
          deadline: new Date("2024-08-15"),
          status: "active",
          owner_user_id: "2",
          icon_name: "laptop",
          color_hex: "#FFC533",
          account_number: "PKT001234567891",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "3",
          name: "Emergency Fund",
          type: "saving",
          target_nominal: 10000000,
          current_balance: 3200000,
          deadline: null,
          status: "active",

          owner_user_id: "3",
          icon_name: "diamond",
          color_hex: "#D9F634",
          account_number: "PKT001234567892",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "4",
          name: "Arisan Keluarga",
          type: "saving",
          target_nominal: 2000000,
          current_balance: 1200000,
          deadline: new Date("2024-07-01"),
          status: "active",

          owner_user_id: "4",
          icon_name: "group",
          color_hex: "#3FD8D4",
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
          icon_name: "airplane",
          color_hex: "#A471E1",
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
