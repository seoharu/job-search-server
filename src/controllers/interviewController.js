// controllers/interview.controller.js
const { Interview, Job } = require('../models');
const logger = require('../utils/logger');

// 면접 생성
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

// 면접 목록 조회
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

// 면접 상세 조회
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

// 면접 결과 및 경험 업데이트
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

// 면접 상태 업데이트
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