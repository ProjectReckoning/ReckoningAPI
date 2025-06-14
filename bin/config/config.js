/*
  Configuration for sequelize
*/

require('dotenv').config();

const port = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined;

module.exports = {
  development: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_NAME || 'mydb',
    host: process.env.DB_HOST || '127.0.0.1',
    port: port,
    dialect: 'postgres',
  },
  test: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: port,
    dialect: 'postgres'
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: port,
    dialect: 'postgres'
  }
};