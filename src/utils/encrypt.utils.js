// Base64 인코딩/디코딩 유틸리티 함수들

// 비밀번호 암호화 (Base64 인코딩)
const encryptPassword = (password) => {
  if (!password) throw new Error('비밀번호가 필요합니다');
  return Buffer.from(password).toString('base64');
};

// 비밀번호 확인 (암호화된 비밀번호와 일치 여부 확인)
const verifyPassword = (inputPassword, hashedPassword) => {
  if (!inputPassword || !hashedPassword) {
    throw new Error('비밀번호 확인에 필요한 값이 누락되었습니다');
  }
  const encodedInput = Buffer.from(inputPassword).toString('base64');
  return encodedInput === hashedPassword;
};

module.exports = {
  encryptPassword,
  verifyPassword
};