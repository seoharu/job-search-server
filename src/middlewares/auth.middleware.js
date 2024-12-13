const { verifyToken } = require('../utils/auth.utils');

const authMiddleware = async (req, res, next) => {
  try {
      // 1. Authorization 헤더 확인
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: '인증 토큰이 필요합니다',
        code: 'AUTH_TOKEN_MISSING'
      });
    }

    // 2. 토큰 추출
    const token = authHeader.split(' ')[1];
    // 3. 토큰 검증
    const decoded = verifyToken(token);

    // 4. 사용자 정보 요청 객체에 추가
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: '유효하지 않은 토큰입니다',
      code: 'INVALID_TOKEN'
    });
  }
};

module.exports = authMiddleware;