const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interviewController');
const auth = require('../middlewares/auth.middleware');

// 모든 라우트에 인증 필요
router.use(auth);

// 면접 생성
router.post('/', interviewController.createInterview);

// 면접 목록 조회
router.get('/', interviewController.getMyInterviews);

// 면접 상세 조회
router.get('/:interview_id', interviewController.getInterviewDetail);

// 면접 결과 및 경험 업데이트
router.put('/:interview_id/result', interviewController.updateInterviewResult);

// 면접 상태 업데이트
router.put('/:interview_id/status', interviewController.updateInterviewStatus);

module.exports = router;