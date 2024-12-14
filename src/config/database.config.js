// src/config/database.config.js

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// 환경변수 확인용 로그
console.log('Environment variables in database.config.js:');
console.log(`DB_HOST: ${process.env.DB_HOST}`);
console.log(`DB_USER: ${process.env.DB_USER}`);
console.log(`DB_PORT: ${process.env.DB_PORT}`);
console.log(`DB_PASSWORD: ${process.env.DB_PASSWORD ? '[PRESENT]' : '[MISSING]'}`);

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'WSD03',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
  },
  test: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'WSD03_test',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'WSD03',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
  }
};