const jwt = require('jsonwebtoken');

// 환경변수에서 JWT_SECRET 가져오기
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h'; // 기본 만료 시간

/**
 * Access Token 생성 함수
 * @param {Object} payload - 토큰에 포함할 사용자 데이터
 * @returns {string} - 생성된 JWT
 */
const generateAccessToken = (payload) => {
    console.log('Payload received:', payload); // 디버깅용
    if (!payload || typeof payload !== 'object') {
        throw new Error('Payload must be a valid object');
    }
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Token 검증 함수
 * @param {string} token - 클라이언트에서 받은 JWT
 * @returns {Object} - 디코딩된 토큰 데이터
 */
const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
};

module.exports = {
    generateAccessToken,
    verifyToken,
};


