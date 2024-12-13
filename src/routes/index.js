// routes/index.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const authController = require('../controllers/authController');

// 공개 라우트
router.post('/auth/login', authController.login);
router.post('/auth/register', authController.register);

// 보호된 라우트
router.get('/jobs', authMiddleware, jobController.getJobs);
router.post('/applications', authMiddleware, applicationController.apply);
router.get('/profile', authMiddleware, userController.getProfile);