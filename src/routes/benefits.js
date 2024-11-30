const express = require('express');
const router = express.Router();
const { Benefit, Job } = require('../models');
const { ValidationError } = require('../utils/errors');
const authMiddleware = require('../middleware/auth');

// 복리후생 목록 조회
router.get('/', async (req, res, next) => {
  try {
    const { category, jobId, page = 1, limit = 20 } = req.query;

    const where = {};
    if (category) {
      where.category = category;
    }
    if (jobId) {
      where.jobId = jobId;
    }

    const benefits = await Benefit.findAndCountAll({
      where,
      include: [{
        model: Job,
        as: 'job',
        attributes: ['id', 'title']
      }],
      limit: parseInt(limit),
      offset: (page - 1) * limit,
      order: [['category', 'ASC'], ['name', 'ASC']]
    });

    res.json({
      status: 'success',
      data: benefits.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(benefits.count / limit),
        totalItems: benefits.count
      }
    });
  } catch (error) {
    next(error);
  }
});

// 특정 복리후생 조회
router.get('/:id', async (req, res, next) => {
  try {
    const benefit = await Benefit.findByPk(req.params.id, {
      include: [{
        model: Job,
        as: 'job',
        attributes: ['id', 'title']
      }]
    });

    if (!benefit) {
      throw new ValidationError('존재하지 않는 복리후생입니다');
    }

    res.json({
      status: 'success',
      data: benefit
    });
  } catch (error) {
    next(error);
  }
});

// 관리자 전용 라우트
router.use(authMiddleware);

// 복리후생 등록
router.post('/', async (req, res, next) => {
  try {
    const { name, category, description, jobId } = req.body;

    if (!name) {
      throw new ValidationError('복리후생 이름은 필수입니다');
    }

    const benefit = await Benefit.create({
      name,
      category,
      description,
      jobId
    });

    res.status(201).json({
      status: 'success',
      data: benefit
    });
  } catch (error) {
    next(error);
  }
});

// 복리후생 수정
router.put('/:id', async (req, res, next) => {
  try {
    const { name, category, description } = req.body;
    const benefit = await Benefit.findByPk(req.params.id);

    if (!benefit) {
      throw new ValidationError('존재하지 않는 복리후생입니다');
    }

    await benefit.update({
      name: name || benefit.name,
      category: category || benefit.category,
      description: description || benefit.description
    });

    res.json({
      status: 'success',
      data: benefit
    });
  } catch (error) {
    next(error);
  }
});

// 복리후생 삭제
router.delete('/:id', async (req, res, next) => {
  try {
    const benefit = await Benefit.findByPk(req.params.id);

    if (!benefit) {
      throw new ValidationError('존재하지 않는 복리후생입니다');
    }

    await benefit.destroy();

    res.json({
      status: 'success',
      message: '복리후생이 삭제되었습니다'
    });
  } catch (error) {
    next(error);
  }
});

// 카테고리별 복리후생 통계
router.get('/stats/categories', async (req, res, next) => {
  try {
    const stats = await Benefit.findAll({
      attributes: [
        'category',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['category'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']]
    });

    res.json({
      status: 'success',
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;