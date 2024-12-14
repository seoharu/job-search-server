/**
 * @typedef {Object} ExpressResponse
 * @property {function(number): ExpressResponse} status - HTTP 상태 코드를 설정하는 함수
 * @property {function(Object): void} json - JSON 응답을 전송하는 함수
 */
/**
* 채용공고 관련 컨트롤러
* @module controllers/job
*/

const db = require('../models');
const Job = db.Job;
const { Op } = require('sequelize');
const logger = require('../utils/logger');

/**
 * 성공 응답 처리 유틸리티 함수
 * @private
 * @param {ExpressResponse} res - Express Response 객체
 * @param {Object} data - 응답에 포함할 데이터
 */

const handleSuccess = (res, data) => {
  res.status(200).json({
    status: "success",
    data: data
  });
};

/**
 * 에러 응답 처리 유틸리티 함수
 * @private
 * @param {ExpressResponse} res - Express Response 객체
 * @param {string} message - 에러 메시지
 * @param {string} code - 에러 코드
 * @param {number} [statusCode=500] - HTTP 상태 코드
 */

const handleError = (res, message, code, statusCode = 500) => {
  logger.error(message);
  res.status(statusCode).json({
    status: "error",
    message: message,
    code: code
  });
};

/**
* 검색 조건을 위한 where 절 생성
* @private
* @param {Object} query - 요청 쿼리 파라미터
* @param {string} [query.search] - 검색 키워드
* @param {string} [query.location] - 위치 필터
* @param {string} [query.experience] - 경력 필터
* @param {number} [query.salary_min] - 최소 급여
* @param {number} [query.salary_max] - 최대 급여
* @param {string} [query.employment_type] - 고용 형태
* @param {string|string[]} [query.tech_stack] - 기술 스택
* @returns {Object} Sequelize where 절 객체
*/
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


/**
 * 특정 Job 조회
 * @async
 * @param {Object} req - Express Request 객체
 * @param {ExpressResponse} res - Express Response 객체
 * @returns {Promise<void>}
 */
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

/**
 * 채용공고 상세 정보 조회
 * @async
 * @param {Object} req - Express Request 객체
 * @param {Object} req.params - URL 파라미터
 * @param {number} req.params.id - 조회할 채용공고 ID
 * @param {ExpressResponse} res - Express Response 객체
 * @returns {Promise<void>}
 */
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
  if (!job) {
    return handleError(res, '채용 공고를 찾을 수 없습니다', 'JOB_NOT_FOUND', 404);
  }

};

module.exports = {
  getJobs,
  getJobById,
};
