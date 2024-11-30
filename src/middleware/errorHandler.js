const logger = require('../utils/logger');
const { CustomError } = require('../utils/errors');

// 요청/응답 로깅 미들웨어
const requestLogger = (req, res, next) => {
  const start = Date.now();
  const logData = {
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.body,
    ip: req.ip,
    userAgent: req.get('user-agent')
  };

  // 응답 완료 후 로깅
  res.on('finish', () => {
    const duration = Date.now() - start;
    logData.statusCode = res.statusCode;
    logData.duration = duration;

    logger.info('API Request', {
      ...logData,
      timestamp: new Date().toISOString()
    });

    // 성능 모니터링 - 응답시간이 길 경우 경고
    if (duration > 1000) {
      logger.warn('Slow API Response', {
        ...logData,
        duration
      });
    }
  });

  next();
};

// 글로벌 에러 핸들러
const errorHandler = (err, req, res, next) => {
  let statusCode = 500;
  let errorCode = 'INTERNAL_ERROR';
  let message = 'Internal Server Error';

  // 커스텀 에러 처리
  if (err instanceof CustomError) {
    statusCode = err.statusCode;
    errorCode = err.errorCode;
    message = err.message;
  }

  // 에러 로깅
  logger.error('Error occurred:', {
    error: {
      message: err.message,
      stack: err.stack,
      code: errorCode
    },
    request: {
      method: req.method,
      path: req.path,
      query: req.query,
      body: req.body,
      ip: req.ip
    }
  });

  // 통일된 에러 응답 포맷
  res.status(statusCode).json({
    status: 'error',
    code: errorCode,
    message,
    timestamp: new Date().toISOString()
  });
};

// 성능 모니터링 미들웨어
const performanceMonitor = (req, res, next) => {
  const start = process.hrtime();

  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const duration = seconds * 1000 + nanoseconds / 1000000;

    // 성능 메트릭 수집
    logger.debug('Performance metric', {
      path: req.path,
      method: req.method,
      duration,
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    });
  });

  next();
};

module.exports = {
  requestLogger,
  errorHandler,
  performanceMonitor
};