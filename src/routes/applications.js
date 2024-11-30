
// 지원 관리 API (/applications)
// 지원하기 (POST /applications)
// - 인증 확인
// - 중복 지원 체크
// - 지원 정보 저장
// - 이력서 첨부 (선택)
//
// 지원 내역 조회 (GET /applications)
// - 사용자별 지원 목록
// - 상태별 필터링
// - 날짜별 정렬
//
// 지원 취소 (DELETE /applications/:id)
// - 인증 확인
// - 취소 가능 여부 확인
// - 상태 업데이트


const express = require('express');
const router = express.Router();
const { Application, Job, User, Company } = require('../models');
const { ValidationError } = require('../utils/errors');
const authMiddleware = require('../middleware/auth');
const { Op, sequelize } = require('sequelize');
const {
  validateApplication,
  checkAdminPermission,
  cacheApplicationList,
  applicationLogger
} = require('../middleware/applicationMiddlewares');

// 모든 라우트에 인증 미들웨어 적용
router.use(authMiddleware);
router.use(applicationLogger);

// 지원 목록 조회 GET /applications
router.get('/', async (req, res, next) => {
  try {
    const {
      status,                // 상태별 필터링
      page = 1,             // 페이지네이션
      limit = 20,
      sortBy = 'appliedAt', // 날짜별 정렬 (instruction 요구사항)
      order = 'DESC'
    } = req.query;

    // 사용자별 지원 목록 (instruction 요구사항)
    const where = { userId: req.user.id };
    if (status) {
      where.status = status;
    }

    const applications = await Application.findAndCountAll({
      where,
      include: [{
        model: Job,
        as: 'job',
        attributes: ['id', 'title', 'description', 'deadline'],
        include: [{
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'location']
        }]
      }],
      order: [[sortBy, order]],
      limit: parseInt(limit),
      offset: (page - 1) * limit
    });

    // 표준화된 응답 형식 (instruction 요구사항)
    res.json({
      status: 'success',
      data: applications.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(applications.count / limit),
        totalItems: applications.count
      }
    });
  } catch (error) {
    next(error);
  }
});

// 특정 지원 내역 조회 GET /applications/:id
router.get('/:id', async (req, res, next) => {
  try {
    const application = await Application.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: [{
        model: Job,
        as: 'job',
        include: [{
          model: Company,
          as: 'company'
        }]
      }]
    });

    if (!application) {
      throw new ValidationError('지원 내역을 찾을 수 없습니다');
    }

    res.json({
      status: 'success',
      data: application
    });
  } catch (error) {
    next(error);
  }
});

// 지원하기 POST /applications
router.post('/', validateApplication, async (req, res, next) => {
  try {
    const { jobId, resumeVersion, coverLetter } = req.body;
    const userId = req.user.id;

    // 중복 지원 체크 (instruction 요구사항)
    const existingApplication = await Application.findOne({
      where: {
        userId,
        jobId,
        status: {
          [Op.not]: 'cancelled'
        }
      }
    });

    if (existingApplication) {
      throw new ValidationError('이미 지원한 공고입니다');
    }

    // 채용공고 유효성 검사
    const job = await Job.findByPk(jobId);
    if (!job) {
      throw new ValidationError('존재하지 않는 채용공고입니다');
    }

    // 마감일 체크
    if (job.deadline && new Date(job.deadline) < new Date()) {
      throw new ValidationError('마감된 채용공고입니다');
    }

    // 지원 정보 저장 (instruction 요구사항)
    const application = await Application.create({
      userId,
      jobId,
      resumeVersion,    // 이력서 첨부 (instruction 요구사항)
      coverLetter,
      status: 'pending',
      appliedAt: new Date()
    });

    res.status(201).json({
      status: 'success',
      data: application
    });
  } catch (error) {
    next(error);
  }
});

// 지원 취소 DELETE /applications/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const application = await Application.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!application) {
      throw new ValidationError('지원 내역을 찾을 수 없습니다');
    }

    // 취소 가능 여부 확인 (instruction 요구사항)
    if (application.status !== 'pending') {
      throw new ValidationError('처리가 진행 중인 지원은 취소할 수 없습니다');
    }

    // 상태 업데이트 (instruction 요구사항)
    await application.update({
      status: 'cancelled',
      cancelledAt: new Date()
    });

    res.json({
      status: 'success',
      message: '지원이 취소되었습니다'
    });
  } catch (error) {
    next(error);
  }
});

// 지원 상태 업데이트 PATCH /applications/:id/status (관리자용)
router.patch('/:id/status', checkAdminPermission, async (req, res, next) => {
  try {
    const { status, reviewerComment } = req.body;

    if (!['pending', 'reviewed', 'accepted', 'rejected'].includes(status)) {
      throw new ValidationError('유효하지 않은 상태값입니다');
    }

    const application = await Application.findByPk(req.params.id);
    if (!application) {
      throw new ValidationError('지원 내역을 찾을 수 없습니다');
    }

    // 상태 업데이트 및 리뷰어 코멘트 추가
    await application.update({
      status,
      reviewerComment,
      reviewedAt: new Date()
    });

    res.json({
      status: 'success',
      data: application
    });
  } catch (error) {
    next(error);
  }
});


// 성능 메트릭 수집 (관리자용)
router.get('/metrics', checkAdminPermission, async (req, res, next) => {
  try {
    const metrics = await Application.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('AVG',
          sequelize.fn('TIMESTAMPDIFF', sequelize.literal('SECOND'),
          sequelize.col('appliedAt'), sequelize.col('reviewedAt'))),
        'avgReviewTime']
      ],
      group: ['status']
    });

    res.json({
      status: 'success',
      data: metrics
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;