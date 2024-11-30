const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { AuthenticationError } = require('../utils/errors');
const logger = require('../utils/logger');

const authMiddleware = async (req, res, next) => {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Authentication token is missing');
    }

    const token = authHeader.split(' ')[1];

    // 토큰 검증
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 사용자 정보 조회
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // 토큰 만료 시간 체크
    if (decoded.exp * 1000 < Date.now()) {
      throw new AuthenticationError('Token has expired');
    }

    // req 객체에 사용자 정보 추가
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin || false
    };

    // 로깅
    logger.debug('User authenticated:', {
      userId: user.id,
      email: user.email,
      path: req.path
    });

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(new AuthenticationError('Invalid token'));
    } else if (error.name === 'TokenExpiredError') {
      next(new AuthenticationError('Token has expired'));
    } else {
      next(error);
    }
  }
};

module.exports = authMiddleware;