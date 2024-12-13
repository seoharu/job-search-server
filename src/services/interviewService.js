// services/interviewService.js
const { Interview, Job } = require('../models');
const logger = require('../utils/logger');

class InterviewService {
  // 면접 생성
  async createInterview(data) {
    try {
      // 면접 날짜 검증
      if (new Date(data.interview_date) <= new Date()) {
        throw new Error('면접 날짜는 현재 시간 이후여야 합니다');
      }

      // 중복 면접 체크
      const existingInterview = await Interview.findOne({
        where: {
          job_id: data.job_id,
          user_id: data.user_id
        }
      });

      if (existingInterview) {
        throw new Error('이미 해당 채용공고에 대한 면접이 존재합니다');
      }

      const interview = await Interview.create({
        ...data,
        status: 'scheduled',
        result: 'pending',
        created_at: new Date(),
        updated_at: new Date()
      });

      logger.info(`Interview created: ${interview.interview_id}`);
      return interview;
    } catch (error) {
      logger.error('Interview creation error:', error);
      throw error;
    }
  }

  // 면접 목록 조회
  async getInterviews(user_id, { status, result, page = 1, limit = 10 }) {
    try {
      const where = { user_id };
      if (status) where.status = status;
      if (result) where.result = result;

      const { count, rows } = await Interview.findAndCountAll({
        where,
        include: [{
          model: Job,
          attributes: ['title', 'company', 'location']
        }],
        limit: parseInt(limit),
        offset: (page - 1) * parseInt(limit),
        order: [['interview_date', 'ASC']]
      });

      return {
        interviews: rows,
        pagination: {
          total: count,
          current_page: page,
          total_pages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      logger.error('Interviews retrieval error:', error);
      throw error;
    }
  }

  // 면접 상세 조회
  async getInterviewDetail(interview_id, user_id) {
    try {
      const interview = await Interview.findOne({
        where: { interview_id, user_id },
        include: [{
          model: Job,
          attributes: ['title', 'company', 'location', 'description']
        }]
      });

      if (!interview) {
        throw new Error('면접을 찾을 수 없습니다');
      }

      return interview;
    } catch (error) {
      logger.error('Interview detail retrieval error:', error);
      throw error;
    }
  }

  // 면접 결과 업데이트
  async updateInterviewResult(interview_id, user_id, { difficulty, result, experience }) {
    try {
      const interview = await Interview.findOne({
        where: { interview_id, user_id }
      });

      if (!interview) {
        throw new Error('면접을 찾을 수 없습니다');
      }

      if (interview.status !== 'completed') {
        throw new Error('완료된 면접에 대해서만 결과를 입력할 수 있습니다');
      }

      await interview.update({
        difficulty,
        result,
        experience,
        updated_at: new Date()
      });

      logger.info(`Interview result updated: ${interview_id}`);
      return interview;
    } catch (error) {
      logger.error('Interview result update error:', error);
      throw error;
    }
  }

  // 면접 상태 업데이트
  async updateInterviewStatus(interview_id, user_id, status) {
    try {
      const interview = await Interview.findOne({
        where: { interview_id, user_id }
      });

      if (!interview) {
        throw new Error('면접을 찾을 수 없습니다');
      }

      await interview.update({
        status,
        updated_at: new Date()
      });

      logger.info(`Interview status updated: ${interview_id}`);
      return interview;
    } catch (error) {
      logger.error('Interview status update error:', error);
      throw error;
    }
  }
}

module.exports = new InterviewService();