const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');

// 공개 API - 인증 불필요
router.get('/', jobController.getJobs);
router.get('/:id', jobController.getJobById);

module.exports = router;