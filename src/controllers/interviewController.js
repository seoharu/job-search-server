/**
 * @typedef {Object} ExpressResponse
 * @property {function(number): ExpressResponse} status - HTTP 상태 코드를 설정하는 함수
 * @property {function(Object): void} json - JSON 응답을 전송하는 함수
 */
/**
* 면접 관련 컨트롤러
* @module controllers/interview
*/


/**
* @typedef {Object} Request
* @property {Object} body - 요청 바디
* @property {Object} params - URL 파라미터
* @property {Object} query - 쿼리 파라미터
* @property {Object} user - 인증된 사용자 정보
*/

/**
* @typedef {Object} Response
* @property {function} status - HTTP 상태 코드 설정 함수
* @property {function} json - JSON 응답 전송 함수
*/

const { Interview, Job } = require('../models');
const logger = require('../utils/logger');

/**
* 새로운 면접 일정 생성
* @async
* @param {Request} req - Express Request 객체
* @param {Object} req.body - 요청 바디
* @param {number} req.body.company_id - 회사 ID
* @param {number} req.body.job_id - 채용공고 ID
* @param {string} req.body.process - 면접 프로세스 단계
* @param {string} [req.body.question] - 면접 질문
* @param {Date} req.body.interview_date - 면접 날짜
* @param {string} req.body.interview_type - 면접 유형
* @param {number} req.body.duration - 면접 소요 시간(분)
* @param {Object} req.user - 인증된 사용자 정보
* @param {number} req.user.id - 사용자 ID
* @param {Response} res - Express Response 객체
* @returns {Promise<void>} 생성된 면접 정보
* @throws {Error} 면접 생성 중 발생한 에러
*/
const createInterview = async (req, res) => {
  try {
    const {
      company_id,
      job_id,
      process,
      question,
      interview_date,
      interview_type,
      duration
    } = req.body;

    // duration 값이 문자열일 경우 숫자로 변환
    const parsedDuration = parseInt(duration, 10);
    if (isNaN(parsedDuration)) {
      return res.status(400).json({
        status: 'error',
        message: 'Duration must be a valid number',
        code: 'INVALID_DURATION',
      });
    }

    const user_id = req.user.id;

    // 필수 필드 검증
    if (!company_id || !job_id || !process || !interview_date || !interview_type) {
      return res.status(400).json({
        status: 'error',
        message: '필수 항목을 모두 입력해주세요',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // 면접 날짜 검증
    if (new Date(interview_date) <= new Date()) {
      return res.status(400).json({
        status: 'error',
        message: '면접 날짜는 현재 시간 이후여야 합니다',
        code: 'INVALID_INTERVIEW_DATE'
      });
    }

    // 이미 면접이 있는지 확인
    const existingInterview = await Interview.findOne({
      where: { job_id, user_id }
    });

    if (existingInterview) {
      return res.status(400).json({
        status: 'error',
        message: '이미 해당 채용공고에 대한 면접이 존재합니다',
        code: 'INTERVIEW_EXISTS'
      });
    }

    const interview = await Interview.create({
      user_id,
      company_id,
      job_id,
      process,
      question,
      interview_date,
      interview_type,
      duration: parsedDuration, // 숫자로 변환된 값 저장,
      status: 'scheduled',
      result: 'pending'
    });

    logger.info(`Interview created: ${interview.interview_id}`);

    res.status(201).json({
      status: 'success',
      data: { interview }
    });
  } catch (error) {
    logger.error('Interview creation error:', error);
    res.status(500).json({
      status: 'error',
      message: '면접 생성 중 오류가 발생했습니다',
      code: 'INTERVIEW_CREATION_ERROR'
    });
  }
};

/**
* 사용자의 면접 목록 조회
* @async
* @param {Request} req - Express Request 객체
* @param {Object} req.query - 쿼리 파라미터
* @param {string} [req.query.status] - 면접 상태 필터
* @param {string} [req.query.result] - 면접 결과 필터
* @param {number} [req.query.page=1] - 페이지 번호
* @param {number} [req.query.limit=10] - 페이지당 항목 수
* @param {Object} req.user - 인증된 사용자 정보
* @param {number} req.user.id - 사용자 ID
* @param {Response} res - Express Response 객체
* @returns {Promise<void>} 면접 목록과 페이지네이션 정보
* @throws {Error} 면접 목록 조회 중 발생한 에러
*/
const getMyInterviews = async (req, res) => {
  try {
    const { status, result, page = 1, limit = 10 } = req.query;
    const user_id = req.user.id;

    const where = { user_id };
    if (status) where.status = status;
    if (result) where.result = result;

    const { count, rows: interviews } = await Interview.findAndCountAll({
      where,
      include: [{
        model: Job,
        as: 'job', // 관계에서 설정한 alias 사용
        attributes: ['title', 'company_id']
      }],
      limit: parseInt(limit),
      offset: (page - 1) * parseInt(limit),
      order: [['interview_date', 'ASC']]
    });

    res.json({
      status: 'success',
      data: {
        interviews,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(count / limit),
          total_items: count
        }
      }
    });
  } catch (error) {
    logger.error('Interview retrieval error:', error);
    res.status(500).json({
      status: 'error',
      message: '면접 목록 조회 중 오류가 발생했습니다',
      code: 'INTERVIEW_RETRIEVAL_ERROR'
    });
  }
};

/**
* 면접 상세 정보 조회
* @async
* @param {Request} req - Express Request 객체
* @param {Object} req.params - URL 파라미터
* @param {number} req.params.interview_id - 조회할 면접 ID
* @param {Object} req.user - 인증된 사용자 정보
* @param {number} req.user.user_id - 사용자 ID
* @param {Response} res - Express Response 객체
* @returns {Promise<void>} 면접 상세 정보
* @throws {Error} 면접 상세 정보 조회 중 발생한 에러
*/
const getInterviewDetail = async (req, res) => {
  try {
    const { interview_id } = req.params;
    const user_id = req.user.user_id;

    const interview = await Interview.findOne({
      where: { interview_id, user_id },
      include: [{
        model: Job,
        attributes: ['title', 'company', 'location', 'description']
      }]
    });

    if (!interview) {
      return res.status(404).json({
        status: 'error',
        message: '면접을 찾을 수 없습니다',
        code: 'INTERVIEW_NOT_FOUND'
      });
    }

    res.json({
      status: 'success',
      data: { interview }
    });
  } catch (error) {
    logger.error('Interview detail retrieval error:', error);
    res.status(500).json({
      status: 'error',
      message: '면접 상세 정보 조회 중 오류가 발생했습니다',
      code: 'INTERVIEW_DETAIL_ERROR'
    });
  }
};

/**
* 면접 결과 및 경험 업데이트
* @async
* @param {Request} req - Express Request 객체
* @param {Object} req.params - URL 파라미터
* @param {number} req.params.interview_id - 업데이트할 면접 ID
* @param {Object} req.body - 요청 바디
* @param {number} [req.body.difficulty] - 면접 난이도 (1-5)
* @param {string} [req.body.result] - 면접 결과
* @param {string} [req.body.experience] - 면접 경험
* @param {Object} req.user - 인증된 사용자 정보
* @param {number} req.user.user_id - 사용자 ID
* @param {Response} res - Express Response 객체
* @returns {Promise<void>} 업데이트된 면접 정보
* @throws {Error} 면접 결과 업데이트 중 발생한 에러
*/
const updateInterviewResult = async (req, res) => {
  try {
    const { interview_id } = req.params;
    const { difficulty, result, experience } = req.body;
    const user_id = req.user.user_id;

    const interview = await Interview.findOne({
      where: { interview_id, user_id }
    });

    if (!interview) {
      return res.status(404).json({
        status: 'error',
        message: '면접을 찾을 수 없습니다',
        code: 'INTERVIEW_NOT_FOUND'
      });
    }

    if (interview.status !== 'completed') {
      return res.status(400).json({
        status: 'error',
        message: '완료된 면접에 대해서만 결과를 입력할 수 있습니다',
        code: 'INVALID_INTERVIEW_STATUS'
      });
    }

    // 난이도 검증
    if (difficulty && (difficulty < 1 || difficulty > 5)) {
      return res.status(400).json({
        status: 'error',
        message: '난이도는 1에서 5 사이의 값이어야 합니다',
        code: 'INVALID_DIFFICULTY'
      });
    }

    await interview.update({
      difficulty,
      result,
      experience,
      updated_at: new Date()
    });

    logger.info(`Interview result updated: ${interview_id}`);

    res.json({
      status: 'success',
      data: { interview }
    });
  } catch (error) {
    logger.error('Interview result update error:', error);
    res.status(500).json({
      status: 'error',
      message: '면접 결과 업데이트 중 오류가 발생했습니다',
      code: 'INTERVIEW_RESULT_UPDATE_ERROR'
    });
  }
};

/**
* 면접 상태 업데이트
* @async
* @param {Request} req - Express Request 객체
* @param {Object} req.params - URL 파라미터
* @param {number} req.params.interview_id - 업데이트할 면접 ID
* @param {Object} req.body - 요청 바디
* @param {string} req.body.status - 변경할 면접 상태
* @param {Object} req.user - 인증된 사용자 정보
* @param {number} req.user.user_id - 사용자 ID
* @param {Response} res - Express Response 객체
* @returns {Promise<void>} 업데이트된 면접 정보
* @throws {Error} 면접 상태 업데이트 중 발생한 에러
*/
const updateInterviewStatus = async (req, res) => {
  try {
    const { interview_id } = req.params;
    const { status } = req.body;
    const user_id = req.user.user_id;

    const interview = await Interview.findOne({
      where: { interview_id, user_id }
    });

    if (!interview) {
      return res.status(404).json({
        status: 'error',
        message: '면접을 찾을 수 없습니다',
        code: 'INTERVIEW_NOT_FOUND'
      });
    }

    await interview.update({
      status,
      updated_at: new Date()
    });

    logger.info(`Interview status updated: ${interview_id}`);

    res.json({
      status: 'success',
      data: { interview }
    });
  } catch (error) {
    logger.error('Interview status update error:', error);
    res.status(500).json({
      status: 'error',
      message: '면접 상태 업데이트 중 오류가 발생했습니다',
      code: 'INTERVIEW_STATUS_UPDATE_ERROR'
    });
  }
};

module.exports = {
  createInterview,
  getMyInterviews,
  getInterviewDetail,
  updateInterviewResult,
  updateInterviewStatus
};