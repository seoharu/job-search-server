// 이메일 형식 검증을 위한 정규식
const EMAIL_REGEX = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

// 공통 에러 응답 함수
const errorResponse = (res, message, code, statusCode = 400) => {
  return res.status(statusCode).json({
    status: 'error',
    message,
    code
  });
};

// 회원가입 데이터 검증
const validateRegister = (req, res, next) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return errorResponse(res, '모든 필드를 입력해주세요', 'MISSING_FIELDS');
  }

  if (!EMAIL_REGEX.test(email)) {
    return errorResponse(res, '유효한 이메일 형식이 아닙니다', 'INVALID_EMAIL');
  }

  if (password.length < 8) {
    return errorResponse(res, '비밀번호는 8자 이상이어야 합니다', 'INVALID_PASSWORD');
  }

  if (name.length < 2 || name.length > 50) {
    return errorResponse(res, '이름은 2자 이상 50자 이하여야 합니다', 'INVALID_NAME');
  }

  next();
};

// 로그인 데이터 검증
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return errorResponse(res, '이메일과 비밀번호를 모두 입력해주세요', 'MISSING_FIELDS');
  }

  if (!EMAIL_REGEX.test(email)) {
    return errorResponse(res, '유효한 이메일 형식이 아닙니다', 'INVALID_EMAIL');
  }

  next();
};

// 프로필 수정 데이터 검증
const validateProfileUpdate = (req, res, next) => {
  const { name, password } = req.body;

  if (!name && !password) {
    return errorResponse(res, '수정할 정보를 입력해주세요', 'NO_UPDATE_DATA');
  }

  if (name && (name.length < 2 || name.length > 50)) {
    return errorResponse(res, '이름은 2자 이상 50자 이하여야 합니다', 'INVALID_NAME');
  }

  if (password && password.length < 8) {
    return errorResponse(res, '비밀번호는 8자 이상이어야 합니다', 'INVALID_PASSWORD');
  }

  next();
};

// 페이지네이션 파라미터 검증
const validatePagination = (page, limit) => {
  const parsedPage = parseInt(page);
  const parsedLimit = parseInt(limit);

  return {
    page: isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage,
    limit: isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100 ? 20 : parsedLimit
  };
};

// 채용공고 목록 조회 파라미터 검증
const validateJobsList = (req, res, next) => {
  const { page, limit, search, sortBy, sortOrder } = req.query;

  // 페이지네이션 검증
  const { page: validPage, limit: validLimit } = validatePagination(page, limit);
  req.query.page = validPage;
  req.query.limit = validLimit;

  if (search && search.length > 100) {
    return errorResponse(res, '검색어는 100자를 초과할 수 없습니다', 'INVALID_SEARCH');
  }

  const validSortFields = ['createdAt', 'deadline', 'views', 'salary_min', 'salary_max', 'title'];
  if (sortBy && !validSortFields.includes(sortBy)) {
    return errorResponse(res, '유효하지 않은 정렬 기준입니다', 'INVALID_SORT_FIELD');
  }

  const validSortOrders = ['ASC', 'DESC'];
  if (sortOrder && !validSortOrders.includes(sortOrder.toUpperCase())) {
    return errorResponse(res, '유효하지 않은 정렬 순서입니다', 'INVALID_SORT_ORDER');
  }

  next();
};

// 채용공고 ID 검증
const validateJobId = (req, res, next) => {
  const { id } = req.params;

  if (!id || id.length !== 20) {
    return errorResponse(res, '유효하지 않은 채용공고 ID입니다', 'INVALID_JOB_ID');
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateProfileUpdate,
  validateJobsList,
  validateJobId
};
