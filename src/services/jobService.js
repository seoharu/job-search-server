// services/jobService.js
const { Op } = require('sequelize');
const { Job } = require('../models');
const logger = require('../utils/logger');

class JobService {
  // 채용공고 목록 조회 (검색, 필터링, 페이지네이션)
  async getJobs({ search, location, experience, salary, techStack, page = 1, limit = 20, sortBy = 'createdAt' }) {
    try {
      const whereClause = {};

      if (search) {
        whereClause[Op.or] = [
          { title: { [Op.like]: `%${search}%` } },
          { company: { [Op.like]: `%${search}%` } },
          { position: { [Op.like]: `%${search}%` } }
        ];
      }

      if (location) whereClause.location = location;
      if (experience) whereClause.experience = experience;
      if (salary) whereClause.salary = { [Op.gte]: salary };
      if (techStack) whereClause.techStack = { [Op.like]: `%${techStack}%` };

      const { count, rows } = await Job.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: (page - 1) * parseInt(limit),
        order: [[sortBy, 'DESC']]
      });

      return {
        jobs: rows,
        pagination: {
          total: count,
          current_page: page,
          total_pages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      logger.error('Job retrieval error:', error);
      throw error;
    }
  }

  // 채용공고 상세 조회
  async getJobById(job_id) {
    try {
      const job = await Job.findByPk(job_id);
      if (!job) {
        throw new Error('채용공고를 찾을 수 없습니다');
      }

      // 조회수 증가
      await job.increment('viewCount');

      return job;
    } catch (error) {
      logger.error('Job detail retrieval error:', error);
      throw error;
    }
  }

  // 관련 채용공고 조회
  async getRelatedJobs(job_id, limit = 5) {
    try {
      const currentJob = await Job.findByPk(job_id);
      if (!currentJob) {
        throw new Error('채용공고를 찾을 수 없습니다');
      }

      const relatedJobs = await Job.findAll({
        where: {
          id: { [Op.ne]: job_id },
          [Op.or]: [
            { company: currentJob.company },
            { techStack: { [Op.like]: `%${currentJob.techStack}%` } }
          ]
        },
        limit
      });

      return relatedJobs;
    } catch (error) {
      logger.error('Related jobs retrieval error:', error);
      throw error;
    }
  }
}

module.exports = new JobService();