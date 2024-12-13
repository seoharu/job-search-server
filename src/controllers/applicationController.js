const { Application, Job, Users } = require('../models');
const logger = require('../utils/logger');

// 지원하기
const applyForJob = async (req, res) => {
  try {
    const { job_id, resumeVersion, coverLetter } = req.body;
    const user_id = req.user.user_id;

    // 필수 필드 검증
    if (!job_id || !resumeVersion) {
      return res.status(400).json({
        status: 'error',
        message: '필수 항목을 모두 입력해주세요',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // 이미 지원한 공고인지 확인
    const existingApplication = await Application.findOne({
      where: { user_id, job_id }
    });

    if (existingApplication) {
      return res.status(400).json({
        status: 'error',
        message: '이미 지원한 공고입니다',
        code: 'ALREADY_APPLIED'
      });
    }

    // 채용 공고 존재 확인
    const job = await Job.findByPk(job_id);
    if (!job) {
      return res.status(404).json({
        status: 'error',
        message: '존재하지 않는 채용 공고입니다',
        code: 'JOB_NOT_FOUND'
      });
    }

    // 지원서 생성
    const application = await Application.create({
      user_id,
      job_id,
      resumeVersion,
      coverLetter,
      status: 'pending',
      appliedAt: new Date()
    });

    logger.info(`New application created: ${application.application_id}`);

    res.status(201).json({
      status: 'success',
      data: {
        application_id: application.application_id,
        job_id: application.job_id,
        status: application.status,
        appliedAt: application.appliedAt
      }
    });
  } catch (error) {
    logger.error('Application creation error:', error);
    res.status(500).json({
      status: 'error',
      message: '지원서 제출 중 오류가 발생했습니다',
      code: 'APPLICATION_ERROR'
    });
  }
};

// 지원 내역 조회
const getMyApplications = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const user_id = req.user.user_id;

    const where = { user_id };
    if (status) {
      where.status = status;
    }

    const offset = (page - 1) * limit;

    const { count, rows: applications } = await Application.findAndCountAll({
      where,
      include: [{
        model: Job,
        attributes: ['title', 'company', 'location']
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['appliedAt', 'DESC']]
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      status: 'success',
      data: {
        applications,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_items: count
        }
      }
    });
  } catch (error) {
    logger.error('Application retrieval error:', error);
    res.status(500).json({
      status: 'error',
      message: '지원 내역 조회 중 오류가 발생했습니다',
      code: 'APPLICATION_RETRIEVAL_ERROR'
    });
  }
};

// 지원서 상세 조회
const getApplicationDetail = async (req, res) => {
  try {
    const { application_id } = req.params;
    const user_id = req.user.user_id;

    const application = await Application.findOne({
      where: { application_id, user_id },
      include: [{
        model: Job,
        attributes: ['title', 'company', 'location', 'description']
      }]
    });

    if (!application) {
      return res.status(404).json({
        status: 'error',
        message: '지원서를 찾을 수 없습니다',
        code: 'APPLICATION_NOT_FOUND'
      });
    }

    res.json({
      status: 'success',
      data: {
        application_id: application.application_id,
        job_id: application.job_id,
        status: application.status,
        resumeVersion: application.resumeVersion,
        coverLetter: application.coverLetter,
        appliedAt: application.appliedAt,
        reviewedAt: application.reviewedAt,
        reviewerComment: application.reviewerComment,
        interviewDate: application.interviewDate,
        job: application.Job
      }
    });
  } catch (error) {
    logger.error('Application detail retrieval error:', error);
    res.status(500).json({
      status: 'error',
      message: '지원서 상세 조회 중 오류가 발생했습니다',
      code: 'APPLICATION_DETAIL_ERROR'
    });
  }
};

// 지원 취소 (상태를 rejected로 변경)
const cancelApplication = async (req, res) => {
  try {
    const { application_id } = req.params;
    const user_id = req.user.user_id;

    const application = await Application.findOne({
      where: { application_id, user_id }
    });

    if (!application) {
      return res.status(404).json({
        status: 'error',
        message: '지원서를 찾을 수 없습니다',
        code: 'APPLICATION_NOT_FOUND'
      });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: '검토가 시작된 지원서는 취소할 수 없습니다',
        code: 'INVALID_CANCELLATION'
      });
    }

    await application.update({
      status: 'rejected',
      reviewedAt: new Date(),
      reviewerComment: '지원자 취소'
    });

    logger.info(`Application canceled: ${application_id}`);

    res.json({
      status: 'success',
      message: '지원이 취소되었습니다'
    });
  } catch (error) {
    logger.error('Application cancellation error:', error);
    res.status(500).json({
      status: 'error',
      message: '지원 취소 중 오류가 발생했습니다',
      code: 'CANCELLATION_ERROR'
    });
  }
};

module.exports = {
  applyForJob,
  getMyApplications,
  getApplicationDetail,
  cancelApplication
};