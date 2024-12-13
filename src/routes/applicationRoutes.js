const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const auth = require('../middlewares/auth.middleware');

// 모든 라우트에 인증 필요
router.use(auth);

router.post('/', applicationController.applyForJob);
router.get('/', applicationController.getMyApplications);
router.get('/:application_id', applicationController.getApplicationDetail);
router.delete('/:application_id', applicationController.cancelApplication);

module.exports = router;