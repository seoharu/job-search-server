const { generateAccessToken } = require('../utils/jwt');
const User = require('../models/user.model');
const { validateEmail, validatePassword } = require('../utils/validators');
const logger = require('../utils/logger');

// 로그인
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
    const accessToken = generateAccessToken(user);

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

// 회원가입
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
    const existingUser = await User.findOne({ email });
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

// 사용자 정보 조회
const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId);
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
          id: user.id,
          email: user.email,
          name: user.name
        }
      }
    });
  } catch (error) {
    logger.error('Profile retrieval error:', error);
    res.status(500).json({
      status: 'error',
      message: '사용자 정보 조회 중 오류가 발생했습니다',
      code: 'PROFILE_ERROR'
    });
  }
};

// 프로필 수정
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

// 회원 탈퇴
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

// 비밀번호 변경
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