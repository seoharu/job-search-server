// controllers/job.controller.js
const { Op } = require('sequelize');
const Job = require('../models/job');
const logger = require('../utils/logger');

// 채용 공고 목록 조회 (페이지네이션, 필터링, 검색, 정렬)
const getJobs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      location,
      experience,
      salary,
      techStack,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    // 검색 및 필터링 조건 구성
    const whereClause = {};

    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { company: { [Op.like]: `%${search}%` } },
        { position: { [Op.like]: `%${search}%` } }
      ];
    }

    if (location) {
      whereClause.location = location;
    }

    if (experience) {
      whereClause.experience = experience;
    }

    if (salary) {
      whereClause.salary = { [Op.gte]: salary };
    }

    if (techStack) {
      whereClause.techStack = { [Op.like]: `%${techStack}%` };
    }

    // 페이지네이션 설정
    const offset = (page - 1) * limit;

    // 정렬 설정
    const validSortFields = ['createdAt', 'salary', 'experience'];
    const validSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const order = validSortFields.includes(sortBy)
      ? [[sortBy, validSortOrder]]
      : [['createdAt', 'DESC']];

    // 데이터 조회
    const { count, rows: jobs } = await Job.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order
    });

    // 페이지네이션 정보
    const totalPages = Math.ceil(count / limit);

    logger.info(`Jobs retrieved with filters: ${JSON.stringify(req.query)}`);

    // 응답
    res.json({
      status: 'success',
      data: {
        jobs,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Error retrieving jobs:', error);
    res.status(500).json({
      status: 'error',
      message: '채용 공고 목록 조회 중 오류가 발생했습니다',
      code: 'JOBS_RETRIEVAL_ERROR'
    });
  }
};

// 채용 공고 상세 조회
const getJobById = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await Job.findByPk(id);
    if (!job) {
      return res.status(404).json({
        status: 'error',
        message: '채용 공고를 찾을 수 없습니다',
        code: 'JOB_NOT_FOUND'
      });
    }

    // 조회수 증가
    await job.increment('viewCount');

    // 관련 공고 추천 (같은 기술스택 또는 같은 회사의 다른 공고)
    const relatedJobs = await Job.findAll({
      where: {
        id: { [Op.ne]: id },
        [Op.or]: [
          { company: job.company },
          { techStack: { [Op.like]: `%${job.techStack}%` } }
        ]
      },
      limit: 5
    });

    logger.info(`Job detail viewed: ${id}`);

    res.json({
      status: 'success',
      data: {
        job,
        relatedJobs
      }
    });
  } catch (error) {
    logger.error('Error retrieving job detail:', error);
    res.status(500).json({
      status: 'error',
      message: '채용 공고 상세 조회 중 오류가 발생했습니다',
      code: 'JOB_DETAIL_ERROR'
    });
  }
};

module.exports = {
  getJobs,
  getJobById
};