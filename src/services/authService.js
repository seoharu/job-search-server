const User = require('../models/user.model');

class AuthService {
  async validateUser(email, password) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다');
    }

    const encodedPassword = Buffer.from(password).toString('base64');
    if (encodedPassword !== user.password) {
      throw new Error('비밀번호가 일치하지 않습니다');
    }

    return user;
  }
}

module.exports = AuthService;