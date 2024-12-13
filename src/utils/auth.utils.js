const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt.config');

// JWT 토큰 생성 함수
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role
    },
    jwtConfig.secret,
    { expiresIn: jwtConfig.expiresIn }
  );
};

// 토큰 검증 함수
const verifyToken = (token) => {
  try {
    return jwt.verify(token, jwtConfig.secret);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

module.exports = {
  generateAccessToken,
  verifyToken
};