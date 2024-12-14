const { verifyToken } = require('../utils/auth.utils');

const authMiddleware = async (req, res, next) => {
  try {
    // 1. Authorization 헤더 확인
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: '인증 토큰이 필요합니다',
        code: 'AUTH_TOKEN_MISSING',
      });
    }

    // 2. 토큰 추출
    const token = authHeader.split(' ')[1];

    // 3. 토큰 검증
    const decoded = verifyToken(token);
    console.log('Decoded token:', decoded); // 디코딩 결과 확인

    if (!decoded) {
      return res.status(401).json({
        status: 'error',
        message: '유효하지 않은 토큰입니다',
        code: 'INVALID_TOKEN',
      });
    }

    // 4. 사용자 정보 요청 객체에 추가
    req.user = decoded;

    // 디버깅: 요청에 추가된 사용자 정보 확인
    console.log('Authenticated user:', req.user);

    next();
  } catch (error) {
    console.error('Token verification failed:', error.message); // 에러 로그 출력

    // 토큰 검증 오류 처리
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: '토큰이 만료되었습니다',
        code: 'TOKEN_EXPIRED',
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: '유효하지 않은 토큰입니다',
        code: 'INVALID_TOKEN',
      });
    } else {
      return res.status(500).json({
        status: 'error',
        message: '서버 오류가 발생했습니다',
        code: 'SERVER_ERROR',
      });
    }
  }
};

module.exports = authMiddleware;
