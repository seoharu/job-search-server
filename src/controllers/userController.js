const { User } = require('../models');
const { generateAccessToken } = require('../utils/jwt');
const logger = require('../utils/logger');

// 로그인
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

// 회원가입
const register = async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;

    // 필수 입력값 검증
    if (!email || !password || !name) {
      return res.status(400).json({
        status: 'error',
        message: '필수 항목을 모두 입력해주세요',
        code: 'MISSING_REQUIRED_FIELDS'
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

// 프로필 조회
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
          created_at: user.created_at,
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

// 프로필 수정
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