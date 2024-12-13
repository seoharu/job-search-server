const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middlewares/auth.middleware');

// 공개 API
router.post('/register', userController.register);
router.post('/login', userController.login);

// 인증 필요 API
router.get('/me', auth, userController.getMyProfile);
router.put('/me', auth, userController.updateMyProfile);

module.exports = router;