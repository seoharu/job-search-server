// JWT 관련 환경 설정
module.exports = {
  secret: process.env.JWT_SECRET,
  expiresIn: '2h',
  tokenType: 'Bearer'
};