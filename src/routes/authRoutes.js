const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const auth = require('../middlewares/auth.middleware');
const authMiddleware = require('../middlewares/auth.middleware');
const { validateRegister, validateLogin } = require('../middlewares/validate.middleware');

router.post('/register', validateRegister, authController.register);
router.post('/login', authController.login);
// 보호된 라우트 예시
router.get('/profile', auth, authController.getProfile);
router.put('/profile', auth, authController.updateProfile);
router.delete('/account', auth, authController.deleteAccount);
router.put('/password', auth, authController.changePassword);
module.exports = router;