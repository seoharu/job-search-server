const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { validateJobsList, validateJobId } = require('../middlewares/validate.middleware');

// 공개 API - 인증 불필요
// 채용 공고 목록 조회
router.get('/', validateJobsList, jobController.getJobs);

// 채용 공고 상세 조회
router.get('/:id', validateJobId, jobController.getJobById);

module.exports = router;