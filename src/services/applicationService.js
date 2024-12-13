// services/applicationService.js
const { Application, Job } = require('../models');
const logger = require('../utils/logger');

class ApplicationService {
  // 지원하기
  async apply(user_id, jobId, resumeVersion, coverLetter) {
    try {
      // 이미 지원한 공고인지 확인
      const existingApplication = await Application.findOne({
        where: { user_id, job_id: jobId }
      });

      if (existingApplication) {
        throw new Error('이미 지원한 공고입니다');
      }

      // 채용공고 존재 확인
      const job = await Job.findByPk(jobId);
      if (!job) {
        throw new Error('존재하지 않는 채용공고입니다');
      }

      const application = await Application.create({
        user_id,
        job_id: jobId,
        resumeVersion,
        coverLetter,
        status: 'pending',
        appliedAt: new Date()
      });

      logger.info(`New application created: ${application.application_id}`);
      return application;
    } catch (error) {
      logger.error('Application creation error:', error);
      throw error;
    }
  }

  // 지원 내역 조회
  async getApplications(user_id, { status, page = 1, limit = 10 }) {
    try {
      const where = { user_id };
      if (status) where.status = status;

      const { count, rows } = await Application.findAndCountAll({
        where,
        include: [{
          model: Job,
          attributes: ['title', 'company', 'location']
        }],
        limit: parseInt(limit),
        offset: (page - 1) * parseInt(limit),
        order: [['appliedAt', 'DESC']]
      });

      return {
        applications: rows,
        pagination: {
          total: count,
          current_page: page,
          total_pages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      logger.error('Applications retrieval error:', error);
      throw error;
    }
  }

  // 지원서 상세 조회
  async getApplicationDetail(application_id, user_id) {
    try {
      const application = await Application.findOne({
        where: { application_id, user_id },
        include: [{
          model: Job,
          attributes: ['title', 'company', 'location', 'description']
        }]
      });

      if (!application) {
        throw new Error('지원서를 찾을 수 없습니다');
      }

      return application;
    } catch (error) {
      logger.error('Application detail retrieval error:', error);
      throw error;
    }
  }

  // 지원 취소
  async cancelApplication(application_id, user_id) {
    try {
      const application = await Application.findOne({
        where: { application_id, user_id }
      });

      if (!application) {
        throw new Error('지원서를 찾을 수 없습니다');
      }

      if (application.status !== 'pending') {
        throw new Error('이미 처리된 지원서는 취소할 수 없습니다');
      }

      await application.update({
        status: 'rejected',
        reviewedAt: new Date(),
        reviewerComment: '지원자 취소'
      });

      logger.info(`Application cancelled: ${application_id}`);
      return application;
    } catch (error) {
      logger.error('Application cancellation error:', error);
      throw error;
    }
  }
}

module.exports = new ApplicationService();