const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const logger = require('./utils/logger');
const sequelize = require('./config/database');
const { requestLogger, errorHandler, performanceMonitor } = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// 미들웨어 등록
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
app.use(performanceMonitor);

// API 라우트 등록
const authRouter = require('./routes/auth');
const jobRouter = require('./routes/jobs');
const applicationRouter = require('./routes/applications');
const bookmarkRouter = require('./routes/bookmarks');
const companyRouter = require('./routes/companies');
const skillRouter = require('./routes/skills');
const interviewRouter = require('./routes/interviews');

app.use('/api/auth', authRouter);
app.use('/api/jobs', jobRouter);
app.use('/api/applications', applicationRouter);
app.use('/api/bookmarks', bookmarkRouter);
app.use('/api/companies', companyRouter);
app.use('/api/skills', skillRouter);
app.use('/api/interviews', interviewRouter);

// 기본 라우트
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Job Search API',
    version: '1.0.0',
    documentation: '/api-docs'  // Swagger 문서 경로
  });
});

// 404 에러 처리
app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
});

// 글로벌 에러 핸들러
app.use(errorHandler);

// 데이터베이스 연결 및 서버 시작
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // 데이터베이스 연결 테스트
    await sequelize.authenticate();
    logger.info('Database connection established successfully.');

    // 서버 시작
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });

  } catch (error) {
    logger.error('Unable to start server:', error);
    process.exit(1);
  }
}

// 서버 시작 함수 실행
startServer();

// 프로세스 종료 처리
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated');
  });
});

module.exports = app;