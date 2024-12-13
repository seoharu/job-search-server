// app.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { sequelize } = require('./config/database');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const bookmarkRoutes = require('./routes/bookmarkRoutes');
const interviewRoutes = require('./routes/interviewRoutes');

// Simple test route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Job Search API' });
});

// Database connection test route
app.get('/test', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ message: 'Database connection successful!' });
  } catch (error) {
    console.error('Connection error details:', error);
    res.status(500).json({
      error: 'Database connection failed!',
      details: error.message
    });
  }
});

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/jobs', jobRoutes);
app.use('/applications', applicationRoutes);
app.use('/bookmarks', bookmarkRoutes);
app.use('/interviews', interviewRoutes);

// 404 에러 처리
app.use((req, res) => {
  logger.warn(`404 Not Found: ${req.method} ${req.url}`);
  res.error('요청하신 경로를 찾을 수 없습니다', 'NOT_FOUND', 404);
});

// 기본 에러 핸들러
app.use((err, req, res, next) => {
  logger.error('Server error:', err);

  // Sequelize 에러 처리
  if (err.name === 'SequelizeValidationError') {
    return res.error('입력값 검증에 실패했습니다', 'VALIDATION_ERROR', 400);
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.error('중복된 데이터가 존재합니다', 'DUPLICATE_ERROR', 400);
  }

  // 기본 에러 응답
  res.error(
    err.message || '서버 내부 오류가 발생했습니다',
    err.code || 'SERVER_ERROR',
    err.status || 500
  );
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;