// src/config/database.js
const { Sequelize } = require('sequelize');
const crypto = require('crypto');
require('dotenv').config();

// UUID 생성 함수
const generateId = () => {
  return crypto.randomBytes(10).toString('hex');
};

// Sequelize 인스턴스 생성
const sequelize = new Sequelize('WSD03', process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: "mysql",
  logging: console.log,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// 데이터베이스 연결 테스트 함수
const testConnection = async () => {
  try {
    // 연결 전에 환경변수 확인
    console.log(process.env);
    console.log(`DB_HOST: ${process.env.DB_HOST}`);
    console.log(`DB_USER: ${process.env.DB_USER}`);
    console.log(`DB_PORT: ${process.env.DB_PORT}`);

    await sequelize.authenticate();
    console.log('Database connection successful');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};



// 날짜 문자열을 Date 객체로 변환하는 유틸리티 함수
const parseDate = (dateStr) => {
  if (!dateStr) return new Date();

  try {
    if (dateStr.includes('등록일')) {
      const datePart = dateStr.replace('등록일', '').trim();
      const [year, month, day] = datePart.split('/');
      return new Date(`20${year}`, month - 1, day);
    }
    return new Date();
  } catch (error) {
    console.error('Date parsing error:', error);
    return new Date();
  }
};

// 급여 정보 파싱 함수
const parseSalary = (salaryStr) => {
  try {
    if (!salaryStr) return [0, 0];

    const numbers = salaryStr.replace(/[^0-9]/g, ' ')
      .split(' ')
      .filter(n => n)
      .map(Number);

    if (numbers.length >= 2) return [numbers[0], numbers[1]];
    if (numbers.length === 1) return [numbers[0], numbers[0]];
    return [0, 0];
  } catch (error) {
    return [0, 0];
  }
};

// 마감일자 파싱 함수
const parseDeadline = (deadlineStr) => {
  if (!deadlineStr) return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  try {
    deadlineStr = deadlineStr.replace('시마감', ':00');

    if (deadlineStr.includes('/')) {
      const [year, month, day] = deadlineStr.split('/');
      return new Date(`20${year}`, month - 1, day);
    }

    if (deadlineStr.includes('-')) {
      const [year, month, day] = deadlineStr.split('-');
      return new Date(year, month - 1, day);
    }

    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  } catch (error) {
    console.error('Deadline parsing error:', error);
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }
};

// 값 정제 함수
const cleanValue = (value, defaultValue = '', allowNull = true) => {
  if (value === undefined || value === null || value === 'NaN' || value === 'nan') {
    return allowNull ? null : defaultValue;
  }
  return String(value);
};

module.exports = {
  sequelize,
  testConnection,
  generateId,
  parseDate,
  parseSalary,
  parseDeadline,
  cleanValue,
  
};