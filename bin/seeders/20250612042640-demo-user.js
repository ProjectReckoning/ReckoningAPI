"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "Users",
      [
        {
          id: "1",
          name: "Ahmad Rizki",
          phone_number: "081234567890",
          password: "$2b$10$abcdefghijklmnopqrstuvwxyz", // hashed password
          pin: 123456,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "2",
          name: "Siti Nurhaliza",
          phone_number: "081234567891",
          password: "$2b$10$abcdefghijklmnopqrstuvwxyz",
          pin: 654321,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "3",
          name: "Budi Santoso",
          phone_number: "081234567892",
          password: "$2b$10$abcdefghijklmnopqrstuvwxyz",
          pin: 111222,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "4",
          name: "Diana Putri",
          phone_number: "081234567893",
          password: "$2b$10$abcdefghijklmnopqrstuvwxyz",
          pin: 333444,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "5",
          name: "Eko Prasetyo",
          phone_number: "081234567894",
          password: "$2b$10$abcdefghijklmnopqrstuvwxyz",
          pin: 555666,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Users", null, {});
  },
};
