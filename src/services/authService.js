// services/authService.js
const { User } = require('../models');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

class AuthService {
  // 회원가입
  async register(userData) {
    try {
      // 이메일 중복 체크
      const existingUser = await User.findOne({
        where: { email: userData.email }
      });

      if (existingUser) {
        throw new Error('이미 존재하는 이메일입니다');
      }

      // 비밀번호 암호화 (Base64)
      const encodedPassword = Buffer.from(userData.password).toString('base64');

      // 사용자 생성
      const user = await User.create({
        ...userData,
        password: encodedPassword,
        status: 'active'
      });

      logger.info(`New user registered: ${user.email}`);

      // 민감한 정보 제외하고 반환
      const { password, ...userWithoutPassword } = user.toJSON();
      return userWithoutPassword;
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  // 로그인
  async login(email, password) {
    try {
      const user = await User.findOne({
        where: { email }
      });

      if (!user) {
        throw new Error('사용자를 찾을 수 없습니다');
      }

      if (user.status !== 'active') {
        throw new Error('비활성화된 계정입니다');
      }

      // 비밀번호 검증
      const encodedPassword = Buffer.from(password).toString('base64');
      if (encodedPassword !== user.password) {
        throw new Error('비밀번호가 일치하지 않습니다');
      }

      // 마지막 로그인 시간 업데이트
      await user.update({
        last_login_at: new Date(),
        updated_at: new Date()
      });

      // JWT 토큰 생성
      const token = jwt.sign(
        { user_id: user.user_id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      logger.info(`User logged in: ${email}`);

      // 민감한 정보 제외하고 반환
      const { password: _, ...userWithoutPassword } = user.toJSON();
      return {
        user: userWithoutPassword,
        token
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  // 프로필 조회
  async getProfile(user_id) {
    try {
      const user = await User.findByPk(user_id);
      if (!user) {
        throw new Error('사용자를 찾을 수 없습니다');
      }

      // 민감한 정보 제외하고 반환
      const { password, ...userWithoutPassword } = user.toJSON();
      return userWithoutPassword;
    } catch (error) {
      logger.error('Profile retrieval error:', error);
      throw error;
    }
  }

  // 프로필 수정
  async updateProfile(user_id, updateData) {
    try {
      const user = await User.findByPk(user_id);
      if (!user) {
        throw new Error('사용자를 찾을 수 없습니다');
      }

      // 수정 불가능한 필드 제거
      delete updateData.email;
      delete updateData.password;
      delete updateData.status;

      // 업데이트 시간 추가
      updateData.updated_at = new Date();

      await user.update(updateData);

      logger.info(`Profile updated for user: ${user.email}`);

      // 민감한 정보 제외하고 반환
      const { password, ...userWithoutPassword } = user.toJSON();
      return userWithoutPassword;
    } catch (error) {
      logger.error('Profile update error:', error);
      throw error;
    }
  }
}

module.exports = new AuthService();