const axios = require('axios');
const baseURL = 'http://localhost:3000';

async function testAuth() {
  try {
    // 1. 회원가입 테스트
    const registerRes = await axios.post(`${baseURL}/auth/register`, {
      email: "test@example.com",
      password: "password123",
      name: "테스트"
    });
    console.log('회원가입 성공:', registerRes.data);

    // 2. 로그인 테스트
    const loginRes = await axios.post(`${baseURL}/auth/login`, {
      email: "test@example.com",
      password: "password123"
    });
    console.log('로그인 성공:', loginRes.data);
    const token = loginRes.data.data.accessToken;

    // 3. 프로필 조회 테스트
    const profileRes = await axios.get(`${baseURL}/profile`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('프로필 조회 성공:', profileRes.data);

  } catch (error) {
    console.error('테스트 실패:', error.response?.data || error.message);
  }
}

testAuth();