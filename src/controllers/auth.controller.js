/**
 * @typedef {Object} ExpressResponse
 * @property {function(number): ExpressResponse} status - HTTP 상태 코드를 설정하는 함수
 * @property {function(Object): void} json - JSON 응답을 전송하는 함수
 */
/**
* 인증 관련 컨트롤러
* @module controllers/auth
*/

/**
* @typedef {Object} Request
* @property {Object} body - 요청 바디
* @property {Object} params - URL 파라미터
* @property {Object} query - 쿼리 파라미터
* @property {Object} user - 인증된 사용자 정보
*/

/**
* @typedef {Object} Response
* @property {function} status - HTTP 상태 코드 설정 함수
* @property {function} json - JSON 응답 전송 함수
*/

const { generateAccessToken } = require('../utils/jwt');
const db = require('../models');
const User = db.User;  // 이렇게 변경
const { validateEmail, validatePassword } = require('../utils/validators');
const logger = require('../utils/logger');

/**
* 사용자 로그인 처리
* @async
* @param {Request} req - Express Request 객체
* @param {Object} req.body - 요청 바디
* @param {string} req.body.email - 사용자 이메일
* @param {string} req.body.password - 사용자 비밀번호
* @param {Response} res - Express Response 객체
* @returns {Promise<void>} JWT 토큰과 사용자 정보 반환
* @throws {Error} 로그인 처리 중 발생한 에러
*/

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 입력값 검증
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: '이메일과 비밀번호를 모두 입력해주세요',
        code: 'MISSING_FIELDS'
      });
    }

    // 이메일 형식 검증
    if (!validateEmail(email)) {
      return res.status(400).json({
        status: 'error',
        message: '유효하지 않은 이메일 형식입니다',
        code: 'INVALID_EMAIL'
      });
    }

    // 사용자 찾기
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: '사용자를 찾을 수 없습니다',
        code: 'USER_NOT_FOUND'
      });
    }

    // 비밀번호 검증 (Base64)
    const encodedPassword = Buffer.from(password).toString('base64');
    if (encodedPassword !== user.password) {
      return res.status(401).json({
        status: 'error',
        message: '비밀번호가 일치하지 않습니다',
        code: 'INVALID_PASSWORD'
      });
    }

    // JWT 토큰 생성
    // JWT 토큰 생성 (순수 객체로 변환)
    const userPayload = {
      id: user.dataValues.user_id,
      email: user.dataValues.email,
      name: user.dataValues.name,
      status: user.dataValues.status
    };


    const accessToken = generateAccessToken(userPayload);

    console.log(accessToken);
    // 로그인 성공 로그
    logger.info(`User logged in successfully: ${user.email}`);

    res.json({
      status: 'success',
      data: {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: '로그인 처리 중 오류가 발생했습니다',
      code: 'LOGIN_ERROR'
    });
  }
};

/**
* 새로운 사용자 등록
* @async
* @param {Request} req - Express Request 객체
* @param {Object} req.body - 요청 바디
* @param {string} req.body.email - 사용자 이메일
* @param {string} req.body.password - 사용자 비밀번호
* @param {string} req.body.name - 사용자 이름
* @param {Response} res - Express Response 객체
* @returns {Promise<void>} 생성된 사용자 정보 반환
* @throws {Error} 회원가입 처리 중 발생한 에러
*/

const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // 입력값 검증
    if (!email || !password || !name) {
      return res.status(400).json({
        status: 'error',
        message: '모든 필드를 입력해주세요',
        code: 'MISSING_FIELDS'
      });
    }

    // 이메일 형식 검증
    if (!validateEmail(email)) {
      return res.status(400).json({
        status: 'error',
        message: '유효하지 않은 이메일 형식입니다',
        code: 'INVALID_EMAIL'
      });
    }

    // 비밀번호 복잡도 검증
    if (!validatePassword(password)) {
      return res.status(400).json({
        status: 'error',
        message: '비밀번호는 최소 6자 이상이어야 하며, 문자와 숫자를 포함해야 합니다',
        code: 'INVALID_PASSWORD_FORMAT'
      });
    }

    // 이메일 중복 체크
    const existingUser = await User.findOne({
        where: {
            email: email
        }
    });

    if (existingUser) {
        return res.status(400).json({
            status: 'error',
            message: '이미 존재하는 이메일입니다',
            code: 'EMAIL_EXISTS'
        });
    }

    // 비밀번호 암호화
    const encodedPassword = Buffer.from(password).toString('base64');

    // 새 사용자 생성
    const user = await User.create({
      email,
      password: encodedPassword,
      name
    });

    logger.info(`New user registered: ${email}`);

    res.status(201).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      status: 'error',
      message: '회원가입 처리 중 오류가 발생했습니다',
      code: 'REGISTER_ERROR'
    });
  }
};

/**
* 사용자 프로필 정보 조회
* @async
* @param {Request} req - Express Request 객체
* @param {Object} req.user - 인증된 사용자 정보
* @param {string} req.user.email - 사용자 이메일
* @param {Response} res - Express Response 객체
* @returns {Promise<void>} 사용자 프로필 정보 반환
* @throws {Error} 프로필 조회 중 발생한 에러
*/

const getProfile = async (req, res) => {
  try {
    // req.user.email에서 이메일 추출
    const user = await User.findOne({ where: { email: req.user.email } });

    // 사용자 존재 여부 확인
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: '사용자를 찾을 수 없습니다',
        code: 'USER_NOT_FOUND'
      });
    }

    // 성공적으로 사용자 정보 반환
    res.json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      }
    });
  } catch (error) {
    // 에러 처리
    logger.error('Profile retrieval error:', error);
    res.status(500).json({
      status: 'error',
      message: '사용자 정보 조회 중 오류가 발생했습니다',
      code: 'PROFILE_ERROR'
    });
  }
};


/**
* 사용자 프로필 정보 수정
* @async
* @param {Request} req - Express Request 객체
* @param {Object} req.body - 요청 바디
* @param {string} req.body.name - 변경할 사용자 이름
* @param {Object} req.user - 인증된 사용자 정보
* @param {number} req.user.userId - 사용자 ID
* @param {Response} res - Express Response 객체
* @returns {Promise<void>} 수정된 사용자 정보 반환
* @throws {Error} 프로필 수정 중 발생한 에러
*/
const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        status: 'error',
        message: '이름을 입력해주세요',
        code: 'MISSING_NAME'
      });
    }

    const user = await User.findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: '사용자를 찾을 수 없습니다',
        code: 'USER_NOT_FOUND'
      });
    }

    await user.update({ name });
    logger.info(`Profile updated for user: ${user.email}`);

    res.json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      }
    });
  } catch (error) {
    logger.error('Profile update error:', error);
    res.status(500).json({
      status: 'error',
      message: '사용자 정보 수정 중 오류가 발생했습니다',
      code: 'UPDATE_PROFILE_ERROR'
    });
  }
};

/**
* 회원 탈퇴 처리
* @async
* @param {Request} req - Express Request 객체
* @param {Object} req.user - 인증된 사용자 정보
* @param {number} req.user.userId - 사용자 ID
* @param {Response} res - Express Response 객체
* @returns {Promise<void>} 탈퇴 완료 메시지 반환
* @throws {Error} 회원 탈퇴 처리 중 발생한 에러
*/
const deleteAccount = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: '사용자를 찾을 수 없습니다',
        code: 'USER_NOT_FOUND'
      });
    }

    await user.destroy();
    logger.info(`Account deleted: ${user.email}`);

    res.json({
      status: 'success',
      message: '회원 탈퇴가 완료되었습니다'
    });
  } catch (error) {
    logger.error('Account deletion error:', error);
    res.status(500).json({
      status: 'error',
      message: '회원 탈퇴 처리 중 오류가 발생했습니다',
      code: 'DELETE_ACCOUNT_ERROR'
    });
  }
};

/**
* 비밀번호 변경
* @async
* @param {Request} req - Express Request 객체
* @param {Object} req.body - 요청 바디
* @param {string} req.body.currentPassword - 현재 비밀번호
* @param {string} req.body.newPassword - 새 비밀번호
* @param {Object} req.user - 인증된 사용자 정보
* @param {number} req.user.userId - 사용자 ID
* @param {Response} res - Express Response 객체
* @returns {Promise<void>} 비밀번호 변경 완료 메시지 반환
* @throws {Error} 비밀번호 변경 중 발생한 에러
*/
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: 'error',
        message: '현재 비밀번호와 새 비밀번호를 모두 입력해주세요',
        code: 'MISSING_PASSWORD_FIELDS'
      });
    }

    // 새 비밀번호 복잡도 검증
    if (!validatePassword(newPassword)) {
      return res.status(400).json({
        status: 'error',
        message: '새 비밀번호는 최소 6자 이상이어야 하며, 문자와 숫자를 포함해야 합니다',
        code: 'INVALID_NEW_PASSWORD'
      });
    }

    const user = await User.findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: '사용자를 찾을 수 없습니다',
        code: 'USER_NOT_FOUND'
      });
    }

    // 현재 비밀번호 확인
    const currentEncodedPassword = Buffer.from(currentPassword).toString('base64');
    if (currentEncodedPassword !== user.password) {
      return res.status(401).json({
        status: 'error',
        message: '현재 비밀번호가 일치하지 않습니다',
        code: 'INVALID_CURRENT_PASSWORD'
      });
    }

    // 새 비밀번호 설정
    const newEncodedPassword = Buffer.from(newPassword).toString('base64');
    await user.update({ password: newEncodedPassword });

    logger.info(`Password changed for user: ${user.email}`);

    res.json({
      status: 'success',
      message: '비밀번호가 성공적으로 변경되었습니다'
    });
  } catch (error) {
    logger.error('Password change error:', error);
    res.status(500).json({
      status: 'error',
      message: '비밀번호 변경 중 오류가 발생했습니다',
      code: 'CHANGE_PASSWORD_ERROR'
    });
  }
};

module.exports = {
  login,
  register,
  getProfile,
  updateProfile,
  deleteAccount,
  changePassword
};