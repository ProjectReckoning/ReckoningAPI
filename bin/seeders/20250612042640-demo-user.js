"use strict";


module.exports = {
  async up(queryInterface, Sequelize) {
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash("password", 10);
    await queryInterface.bulkInsert(
      "Users",
      [
        {
          id: "1",
          name: "Ahmad Rizki",
          phone_number: "6281234567890",
          password: hashedPassword, // hashed password
          pin: "123456",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "2",
          name: "Siti Nurhaliza",
          phone_number: "6281234567891",
          password: hashedPassword,
          pin: "654321",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "3",
          name: "Budi Santoso",
          phone_number: "6281234567892",
          password: hashedPassword,
          pin: "111222",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "4",
          name: "Diana Putri",
          phone_number: "6281234567893",
          password: hashedPassword,
          pin: "333444",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "5",
          name: "Eko Prasetyo",
          phone_number: "6281234567894",
          password: hashedPassword,
          pin: "555666",
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ],
      {}
    );

    await queryInterface.sequelize.query(`
      SELECT setval('public."Users_id_seq"', COALESCE((SELECT MAX(id) FROM "Users"), 0) + 1, false);
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Users", null, {});
  },
};
