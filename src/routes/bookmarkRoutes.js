const express = require('express');
const router = express.Router();
const bookmarkController = require('../controllers/bookmarkController');
const auth = require('../middlewares/auth.middleware');

// 모든 라우트에 인증 필요
router.use(auth);

router.post('/', bookmarkController.toggleBookmark);
router.get('/', bookmarkController.getMyBookmarks);
router.put('/:bookmark_id', bookmarkController.updateBookmark);
router.get('/status/:job_id', bookmarkController.checkBookmarkStatus);

module.exports = router;