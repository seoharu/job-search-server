/**
 * @typedef {Object} ExpressResponse
 * @property {function(number): ExpressResponse} status - HTTP 상태 코드를 설정하는 함수
 * @property {function(Object): void} json - JSON 응답을 전송하는 함수
 */

/**
* 사용자 관련 컨트롤러
* @module controllers/user
*/

const db = require('../models');
const User = db.User;  // users.js에서 정의된 모델을 가져옴
const { generateAccessToken } = require('../utils/jwt');
const logger = require('../utils/logger');

/**
 * 사용자 로그인 처리
 * @async
 * @param {Object} req - Express Request 객체
 * @param {Object} req.body - 요청 바디
 * @param {string} req.body.email - 사용자 이메일
 * @param {string} req.body.password - 사용자 비밀번호
 * @param {ExpressResponse} res - Express Response 객체
 * @returns {Promise<void>} JWT 토큰과 사용자 정보 반환
 * @throws {Error} 로그인 처리 중 발생한 에러
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 필수 입력값 검증
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: '이메일과 비밀번호를 입력해주세요',
        code: 'MISSING_FIELDS'
      });
    }

    // 사용자 찾기
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: '존재하지 않는 사용자입니다',
        code: 'USER_NOT_FOUND'
      });
    }

    // 계정 상태 확인
    if (user.status !== 'active') {
      return res.status(401).json({
        status: 'error',
        message: '비활성화된 계정입니다',
        code: 'INACTIVE_ACCOUNT'
      });
    }

    // 비밀번호 검증
    const encodedPassword = Buffer.from(password).toString('base64');
    if (encodedPassword !== user.password) {
      return res.status(401).json({
        status: 'error',
        message: '비밀번호가 일치하지 않습니다',
        code: 'INVALID_PASSWORD'
      });
    }

    // 마지막 로그인 시간 업데이트
    await user.update({
      last_login_at: new Date(),
      updated_at: new Date()
    });

    // JWT 토큰 생성
    const accessToken = generateAccessToken(user);
    console.log(accessToken);

    logger.info(`User logged in: ${email}`);

    res.json({
      status: 'success',
      data: {
        accessToken,
        user: {
          user_id: user.user_id,
          email: user.email,
          name: user.name,
          phone: user.phone
        }
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: '로그인 중 오류가 발생했습니다',
      code: 'LOGIN_ERROR'
    });
  }
};

/**
 * 새로운 사용자 등록
 * @async
 * @param {Object} req - Express Request 객체
 * @param {Object} req.body - 요청 바디
 * @param {string} req.body.email - 사용자 이메일
 * @param {string} req.body.password - 사용자 비밀번호 (8자 이상)
 * @param {string} req.body.name - 사용자 이름
 * @param {string} [req.body.phone] - 사용자 전화번호 (선택)
 * @param {Object} res - Express Response 객체
 * @returns {Promise<void>} 생성된 사용자 정보 반환
 * @throws {Error} 회원가입 처리 중 발생한 에러
 */
const register = async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;
    console.log(email, password, name, phone)

    // 필수 입력값 검증
    if (!email || !password || !name) {
      return res.status(400).json({
        status: 'error',
        message: '필수 항목을 모두 입력해주세요',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // 비밀번호 길이 검증 추가
    if (password.length < 8) {  // 8자 이상으로 설정
      return res.status(400).json({
        status: 'error',
        message: '비밀번호는 8자 이상이어야 합니다',
        code: 'INVALID_PASSWORD'
      });
    }

    // 이메일 중복 확인
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: '이미 존재하는 이메일입니다',
        code: 'EMAIL_EXISTS'
      });
    }

    // 비밀번호 인코딩
    const encodedPassword = Buffer.from(password).toString('base64');

    // 사용자 생성
    const user = await User.create({
      email,
      password: encodedPassword,
      name,
      phone,
      status: 'active'
    });

    logger.info(`New user registered: ${email}`);

    res.status(201).json({
      status: 'success',
      data: {
        user: {
          user_id: user.user_id,
          email: user.email,
          name: user.name,
          phone: user.phone
        }
      }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      status: 'error',
      message: '회원가입 중 오류가 발생했습니다',
      code: 'REGISTER_ERROR'
    });
  }
};

/**
 * 사용자 프로필 정보 조회
 * @async
 * @param {Object} req - Express Request 객체
 * @param {Object} req.user - 인증된 사용자 정보
 * @param {number} req.user.user_id - 사용자 ID
 * @param {Object} res - Express Response 객체
 * @returns {Promise<void>} 사용자 프로필 정보
 * @throws {Error} 프로필 조회 중 발생한 에러
 */
const getMyProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.user_id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: '사용자를 찾을 수 없습니다',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      status: 'success',
      data: {
        user: {
          user_id: user.user_id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          resume: user.resume,
          createdAt: user.createdAt,
          last_login_at: user.last_login_at
        }
      }
    });
  } catch (error) {
    logger.error('Profile retrieval error:', error);
    res.status(500).json({
      status: 'error',
      message: '프로필 조회 중 오류가 발생했습니다',
      code: 'PROFILE_ERROR'
    });
  }
};

/**
 * 사용자 프로필 정보 수정
 * @async
 * @param {Object} req - Express Request 객체
 * @param {Object} req.body - 요청 바디
 * @param {string} [req.body.name] - 변경할 이름 (선택)
 * @param {string} [req.body.phone] - 변경할 전화번호 (선택)
 * @param {string} [req.body.resume] - 변경할 이력서 정보 (선택)
 * @param {Object} req.user - 인증된 사용자 정보
 * @param {number} req.user.user_id - 사용자 ID
 * @param {Object} res - Express Response 객체
 * @returns {Promise<void>} 수정된 사용자 정보
 * @throws {Error} 프로필 수정 중 발생한 에러
 */
const updateMyProfile = async (req, res) => {
  try {
    const { name, phone, resume } = req.body;

    const user = await User.findByPk(req.user.user_id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: '사용자를 찾을 수 없습니다',
        code: 'USER_NOT_FOUND'
      });
    }

    const updateData = { updated_at: new Date() };
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (resume !== undefined) updateData.resume = resume;

    await user.update(updateData);

    logger.info(`Profile updated for user: ${user.email}`);

    res.json({
      status: 'success',
      data: {
        user: {
          user_id: user.user_id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          resume: user.resume
        }
      }
    });
  } catch (error) {
    logger.error('Profile update error:', error);
    res.status(500).json({
      status: 'error',
      message: '프로필 수정 중 오류가 발생했습니다',
      code: 'UPDATE_PROFILE_ERROR'
    });
  }
};

module.exports = {
  login,
  register,
  getMyProfile,
  updateMyProfile
};