// 이메일 형식 검증을 위한 정규식
const EMAIL_REGEX = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

// 회원가입 데이터 검증
const validateRegister = (req, res, next) => {
  const { email, password, name } = req.body;

  // 필수 필드 존재 여부 확인
  if (!email || !password || !name) {
    return res.status(400).json({
      status: 'error',
      message: '모든 필드를 입력해주세요',
      code: 'MISSING_FIELDS'
    });
  }

  // 이메일 형식 검증
  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({
      status: 'error',
      message: '유효한 이메일 형식이 아닙니다',
      code: 'INVALID_EMAIL'
    });
  }

  // 비밀번호 길이 검증
  if (password.length < 8) {
    return res.status(400).json({
      status: 'error',
      message: '비밀번호는 8자 이상이어야 합니다',
      code: 'INVALID_PASSWORD'
    });
  }

  // 이름 길이 검증
  if (name.length < 2 || name.length > 50) {
    return res.status(400).json({
      status: 'error',
      message: '이름은 2자 이상 50자 이하여야 합니다',
      code: 'INVALID_NAME'
    });
  }

  next();
};

// 로그인 데이터 검증
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  // 필수 필드 존재 여부 확인
  if (!email || !password) {
    return res.status(400).json({
      status: 'error',
      message: '이메일과 비밀번호를 모두 입력해주세요',
      code: 'MISSING_FIELDS'
    });
  }

  // 이메일 형식 검증
  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({
      status: 'error',
      message: '유효한 이메일 형식이 아닙니다',
      code: 'INVALID_EMAIL'
    });
  }

  next();
};

// 프로필 수정 데이터 검증
const validateProfileUpdate = (req, res, next) => {
  const { name, password } = req.body;

  // 최소한 하나의 필드는 있어야 함
  if (!name && !password) {
    return res.status(400).json({
      status: 'error',
      message: '수정할 정보를 입력해주세요',
      code: 'NO_UPDATE_DATA'
    });
  }

  // 이름이 있는 경우 길이 검증
  if (name && (name.length < 2 || name.length > 50)) {
    return res.status(400).json({
      status: 'error',
      message: '이름은 2자 이상 50자 이하여야 합니다',
      code: 'INVALID_NAME'
    });
  }

  // 비밀번호가 있는 경우 길이 검증
  if (password && password.length < 8) {
    return res.status(400).json({
      status: 'error',
      message: '비밀번호는 8자 이상이어야 합니다',
      code: 'INVALID_PASSWORD'
    });
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateProfileUpdate
};