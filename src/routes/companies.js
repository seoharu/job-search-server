const express = require('express');
const router = express.Router();
const { Company, Job, Benefit } = require('../models');
const { ValidationError } = require('../utils/errors');
const authMiddleware = require('../middleware/auth');
const { Op } = require('sequelize');

// 기본 회사 목록 조회 (채용공고 필터링/검색에 필요한 기능)
router.get('/', async (req, res, next) => {
  try {
    const {
      search,          // 회사명 검색
      industry,        // 산업 분야 필터
      location,        // 지역 필터
      size,           // 회사 규모 필터
      hasActiveJobs,   // 채용중인 회사만
      page = 1,
      limit = 20,
      sortBy = 'name',
      order = 'ASC'
    } = req.query;

    // 검색 조건 구성
    const where = { status: 'active' };

    if (search) {
      where.name = { [Op.like]: `%${search}%` };
    }
    if (industry) where.industry = industry;
    if (location) where.location = { [Op.like]: `%${location}%` };
    if (size) where.size = size;
    if (hasActiveJobs === 'true') {
      where.activeJobCount = { [Op.gt]: 0 };
    }

    const companies = await Company.findAndCountAll({
      where,
      include: [{
        model: Job,
        as: 'jobs',
        where: { status: 'active' },
        required: false,
        attributes: ['id', 'title']
      }],
      order: [[sortBy, order]],
      limit: parseInt(limit),
      offset: (page - 1) * limit
    });

    // 표준화된 응답 형식
    res.json({
      status: 'success',
      data: companies.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(companies.count / limit),
        totalItems: companies.count
      }
    });
  } catch (error) {
    next(error);
  }
});

// 특정 회사의 채용공고 목록 조회
router.get('/:id/jobs', async (req, res, next) => {
  try {
    const {
      status = 'active',
      page = 1,
      limit = 20
    } = req.query;

    const company = await Company.findOne({
      where: {
        id: req.params.id,
        status: 'active'
      },
      include: [{
        model: Job,
        as: 'jobs',
        where: { status },
        include: [{
          model: Benefit,
          as: 'benefits'
        }],
        limit: parseInt(limit),
        offset: (page - 1) * limit
      }]
    });

    if (!company) {
      throw new ValidationError('존재하지 않는 회사입니다');
    }

    res.json({
      status: 'success',
      data: {
        company: {
          id: company.id,
          name: company.name,
          industry: company.industry,
          size: company.size
        },
        jobs: company.jobs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(company.jobs.length / limit),
          totalItems: company.jobs.length
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// 회사 상세 정보 조회 (채용공고 상세에 필요한 회사 정보 포함)
router.get('/:id', async (req, res, next) => {
  try {
    const company = await Company.findOne({
      where: {
        id: req.params.id,
        status: 'active'
      },
      include: [{
        model: Job,
        as: 'jobs',
        where: { status: 'active' },
        required: false,
        attributes: ['id', 'title', 'createdAt']
      }]
    });

    if (!company) {
      throw new ValidationError('존재하지 않는 회사입니다');
    }

    const responseData = {
      ...company.toJSON(),
      activeJobCount: company.jobs.length,
      recentJobs: company.jobs.slice(0, 5) // 최근 5개 채용공고만 포함
    };

    res.json({
      status: 'success',
      data: responseData
    });
  } catch (error) {
    next(error);
  }
});

// 관리자 전용 라우트
router.use(authMiddleware);

// 회사 등록 (채용공고 등록에 필요)
router.post('/', async (req, res, next) => {
  try {
    const {
      name,
      location,
      size,
      industry,
      description,
      logoUrl,
      website,
      foundedYear,
      employeeCount,
      benefits,
      contactEmail,
      companyRegistrationNumber
    } = req.body;

    // 필수 필드 검증
    if (!name || !location || !industry) {
      throw new ValidationError('필수 정보가 누락되었습니다');
    }

    const company = await Company.create({
      name,
      location,
      size,
      industry,
      description,
      logoUrl,
      website,
      foundedYear,
      employeeCount,
      benefits,
      contactEmail,
      companyRegistrationNumber,
      status: 'active',
      activeJobCount: 0
    });

    res.status(201).json({
      status: 'success',
      data: company
    });
  } catch (error) {
    next(error);
  }
});

// 회사 정보 수정 (채용공고 수정에 필요)
router.put('/:id', async (req, res, next) => {
  try {
    const company = await Company.findByPk(req.params.id);
    if (!company) {
      throw new ValidationError('존재하지 않는 회사입니다');
    }

    // 업데이트 불가능한 필드 제외
    const {
      activeJobCount,
      status,
      companyRegistrationNumber,
      ...updateData
    } = req.body;

    await company.update(updateData);

    res.json({
      status: 'success',
      data: company
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;