const { ValidationError } = require('../utils/errors');
const { Application } = require('../models');
const Redis = require('ioredis');
const logger = require('../utils/logger');

// Redis 클라이언트 설정
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
});

// 요청 데이터 검증 미들웨어
const validateApplication = (req, res, next) => {
  const { jobId, resumeVersion } = req.body;

  const errors = [];
  if (!jobId) errors.push('채용공고 ID는 필수입니다');
  if (!resumeVersion) errors.push('이력서 버전은 필수입니다');

  if (errors.length > 0) {
    throw new ValidationError(errors.join(', '));
  }

  next();
};

// 관리자 권한 체크 미들웨어
const checkAdminPermission = (req, res, next) => {
  if (!req.user.isAdmin) {
    throw new ValidationError('관리자 권한이 필요합니다');
  }
  next();
};

// 캐시 미들웨어
const cacheApplicationList = async (req, res, next) => {
  const { userId } = req.user;
  const cacheKey = `applications:${userId}:${JSON.stringify(req.query)}`;

  try {
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      logger.info(`Cache hit for ${cacheKey}`);
      return res.json(JSON.parse(cachedData));
    }

    // 원본 json 메소드를 저장
    const originalJson = res.json;

    // json 메소드를 오버라이드하여 응답을 캐시에 저장
    res.json = function(data) {
      redis.setex(cacheKey, 300, JSON.stringify(data)); // 5분간 캐시
      return originalJson.call(this, data);
    };

    next();
  } catch (error) {
    logger.error('Cache error:', error);
    next(); // 캐시 에러시 그냥 진행
  }
};

// 상세 로깅 미들웨어
const applicationLogger = (req, res, next) => {
  const startTime = Date.now();

  // 응답 완료 후 로깅
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info('Application API Call', {
      method: req.method,
      path: req.path,
      query: req.query,
      userId: req.user?.id,
      status: res.statusCode,
      duration,
      timestamp: new Date().toISOString()
    });
  });

  next();
};

module.exports = {
  validateApplication,
  checkAdminPermission,
  cacheApplicationList,
  applicationLogger
};