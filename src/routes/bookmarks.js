const express = require('express');
const router = express.Router();
const { Bookmark, Job, Company } = require('../models');
const { ValidationError } = require('../utils/errors');
const authMiddleware = require('../middleware/auth');

// 모든 라우트에 인증 미들웨어 적용
router.use(authMiddleware);

// 북마크 목록 조회 (GET /bookmarks)
router.get('/', async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      order = 'DESC'  // 최신순 정렬 (instruction 요구사항)
    } = req.query;

    // 사용자별 북마크 (instruction 요구사항)
    const bookmarks = await Bookmark.findAndCountAll({
      where: {
        userId: req.user.id
      },
      include: [{
        model: Job,
        as: 'job',
        attributes: ['id', 'title', 'description', 'location', 'employmentType'],
        include: [{
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'logoUrl']
        }]
      }],
      order: [['createdAt', order]],  // 최신순 정렬
      limit: parseInt(limit),
      offset: (page - 1) * limit
    });

    // 표준화된 응답 형식
    res.json({
      status: 'success',
      data: bookmarks.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(bookmarks.count / limit),
        totalItems: bookmarks.count
      }
    });
  } catch (error) {
    next(error);
  }
});

// 북마크 추가/제거 토글 (POST /bookmarks)
router.post('/', async (req, res, next) => {
  try {
    const { jobId, note, notification } = req.body;
    const userId = req.user.id;

    // Job 존재 여부 확인
    const job = await Job.findByPk(jobId);
    if (!job) {
      throw new ValidationError('존재하지 않는 채용공고입니다');
    }

    // 기존 북마크 확인 (토글 처리를 위해)
    let bookmark = await Bookmark.findOne({
      where: { userId, jobId }
    });

    let message;
    if (bookmark) {
      // 이미 북마크된 경우 제거
      await bookmark.destroy();
      message = '북마크가 취소되었습니다';
    } else {
      // 새로운 북마크 추가
      bookmark = await Bookmark.create({
        userId,
        jobId,
        note,
        notification
      });
      message = '북마크가 추가되었습니다';
    }

    res.json({
      status: 'success',
      message,
      data: bookmark
    });
  } catch (error) {
    next(error);
  }
});

// 북마크 메모 업데이트
router.patch('/:id/note', async (req, res, next) => {
  try {
    const { note } = req.body;
    const bookmark = await Bookmark.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!bookmark) {
      throw new ValidationError('북마크를 찾을 수 없습니다');
    }

    await bookmark.update({ note });

    res.json({
      status: 'success',
      message: '북마크 메모가 업데이트되었습니다',
      data: bookmark
    });
  } catch (error) {
    next(error);
  }
});

// 북마크 알림 설정 토글
router.patch('/:id/notification', async (req, res, next) => {
  try {
    const bookmark = await Bookmark.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!bookmark) {
      throw new ValidationError('북마크를 찾을 수 없습니다');
    }

    await bookmark.update({
      notification: !bookmark.notification
    });

    res.json({
      status: 'success',
      message: `알림이 ${bookmark.notification ? '설정' : '해제'}되었습니다`,
      data: bookmark
    });
  } catch (error) {
    next(error);
  }
});

// 북마크 상세 조회
router.get('/:id', async (req, res, next) => {
  try {
    const bookmark = await Bookmark.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: [{
        model: Job,
        as: 'job',
        include: [{
          model: Company,
          as: 'company'
        }]
      }]
    });

    if (!bookmark) {
      throw new ValidationError('북마크를 찾을 수 없습니다');
    }

    res.json({
      status: 'success',
      data: bookmark
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;