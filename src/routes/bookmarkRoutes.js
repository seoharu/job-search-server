const express = require('express');
const router = express.Router();
const bookmarkController = require('../controllers/bookmarkController');
const auth = require('../middlewares/auth.middleware');

// 모든 라우트에 인증 미들웨어 적용
router.use(auth);

// 북마크 생성 및 토글
router.post('/', bookmarkController.toggleBookmark);

// 사용자의 북마크 목록 조회
router.get('/', bookmarkController.getMyBookmarks);

// 특정 북마크 업데이트
router.put('/:bookmark_id', bookmarkController.updateBookmark);

// 특정 공고의 북마크 상태 확인
router.get('/status/:job_id', bookmarkController.checkBookmarkStatus);

module.exports = router;
