const db = require('../models');
const Job = db.Job;
const { Op } = require('sequelize');
const logger = require('../utils/logger');

// 성공 응답 처리
const handleSuccess = (res, data) => {
  res.status(200).json({
    status: "success",
    data: data
  });
};

// 에러 응답 처리
const handleError = (res, message, code) => {
  logger.error(message);
  res.status(500).json({
    status: "error",
    message: message,
    code: code
  });
};

// 공통 where 절 생성 로직
const buildWhereClause = (query) => {
  const { search, location, experience, salary_min, salary_max, employment_type, tech_stack } = query;
  const whereClause = { status: 'active' }; // 활성화된 공고만 검색

  // 키워드 검색 개선 (회사명 포함)
  if (search) {
    whereClause[Op.or] = [
      { title: { [Op.like]: `%${search}%` } },
      { description: { [Op.like]: `%${search}%` } },
      { requirements: { [Op.like]: `%${search}%` } },
      { '$Company.name$': { [Op.like]: `%${search}%` } }  // 회사명 검색 추가
    ];
  }

  if (location) {
    whereClause.location = { [Op.like]: `%${location}%` };
  }

  if (experience) {
    whereClause.experience_level = { [Op.like]: `%${experience}%` };
  }

  // 급여 범위 검색 개선
  if (salary_min) {
    whereClause.salary_min = { [Op.gte]: parseInt(salary_min) };
  }
  if (salary_max) {
    whereClause.salary_max = { [Op.lte]: parseInt(salary_max) };
  }

  if (employment_type) {
    whereClause.employment_type = employment_type;
  }

  // 기술 스택 필터링 추가
  if (tech_stack) {
    const techStacks = Array.isArray(tech_stack) ? tech_stack : [tech_stack];
    whereClause.tech_stack = {
      [Op.overlap]: techStacks
    };
  }

  return whereClause;
};

// 채용 공고 목록 조회
const getJobs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const whereClause = buildWhereClause(req.query);

    // 정렬 옵션
    const validSortFields = ['createdAt', 'deadline', 'views',
      'salary_min', 'salary_max', 'title'];
    const order = validSortFields.includes(sortBy)
      ? [[sortBy, 'DESC']]
      : [['createdAt', 'DESC']];

    const { count, rows: jobs } = await Job.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: (page - 1) * parseInt(limit),
      order,
      include: [
        {
          model: db.Company,
          as: 'Company',  // 모델에서 정의한 as와 일치
          attributes: ['name', 'location'],
        },
      ],
    });

    handleSuccess(res, {
      jobs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / parseInt(limit)),
        totalItems: count
      }
    });
  } catch (error) {
    console.error('채용 공고 목록 조회 중 오류가 발생했습니다:', error.message);

  }
};

// 채용 공고 상세 조회
const getJobById = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await Job.findByPk(id, {
      include: [
        {
          model: db.Company,
          attributes: ['name', 'location', 'size', 'industry'],
        },
      ],
    });

    if (!job) {
      return res.error('채용 공고를 찾을 수 없습니다', 'JOB_NOT_FOUND', 404);
    }

    // 조회수 증가
    await job.increment('views');

    // 관련 공고 추천
    const relatedJobs = await Job.findAll({
      where: {
        job_id: { [Op.ne]: id },
        status: 'active',
        [Op.or]: [
          { company_id: job.company_id },
          { experience_level: job.experience_level },
        ],
      },
      limit: 5,
      include: [
        {
          model: db.Company,
          as: 'Company',  // 모델에서 정의한 as와 일치
          attributes: ['name', 'location'],
        },
      ],
    });

    res.success({
      job,
      relatedJobs,
    });
  } catch (error) {
    handleError(res, '채용 공고 상세 조회 중 오류가 발생했습니다', 'JOB_DETAIL_ERROR', error);
  }
};

module.exports = {
  getJobs,
  getJobById,
};
