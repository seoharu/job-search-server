const { Bookmark, Job } = require('../models');
const logger = require('../utils/logger');

// 북마크 추가/제거 (토글)
const toggleBookmark = async (req, res) => {
  try {
    const { job_id, note, notification = false } = req.body;
    const user_id = req.user.user_id;

    // 채용 공고 존재 확인
    const job = await Job.findByPk(job_id);
    if (!job) {
      return res.status(404).json({
        status: 'error',
        message: '존재하지 않는 채용 공고입니다',
        code: 'JOB_NOT_FOUND'
      });
    }

    // 이미 북마크한 공고인지 확인
    const existingBookmark = await Bookmark.findOne({
      where: { user_id, job_id }
    });

    if (existingBookmark) {
      // 북마크 제거
      await existingBookmark.destroy();
      logger.info(`Bookmark removed: ${existingBookmark.bookmark_id}`);

      return res.json({
        status: 'success',
        message: '북마크가 제거되었습니다',
        data: { bookmarked: false }
      });
    }

    // 새 북마크 추가
    const now = new Date();
    const bookmark = await Bookmark.create({
      user_id,
      job_id,
      note,
      notification,
      created_at: now,
      updated_at: now
    });

    logger.info(`New bookmark created: ${bookmark.bookmark_id}`);

    res.status(201).json({
      status: 'success',
      data: {
        bookmark_id: bookmark.bookmark_id,
        bookmarked: true,
        notification: bookmark.notification,
        created_at: bookmark.created_at
      }
    });
  } catch (error) {
    logger.error('Bookmark toggle error:', error);
    res.status(500).json({
      status: 'error',
      message: '북마크 처리 중 오류가 발생했습니다',
      code: 'BOOKMARK_ERROR'
    });
  }
};

// 북마크 목록 조회
const getMyBookmarks = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const user_id = req.user.user_id;

    const offset = (page - 1) * limit;

    const { count, rows: bookmarks } = await Bookmark.findAndCountAll({
      where: { user_id },
      include: [{
        model: Job,
        attributes: ['title', 'company', 'location', 'salary', 'experience']
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      status: 'success',
      data: {
        bookmarks,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_items: count
        }
      }
    });
  } catch (error) {
    logger.error('Bookmark retrieval error:', error);
    res.status(500).json({
      status: 'error',
      message: '북마크 목록 조회 중 오류가 발생했습니다',
      code: 'BOOKMARK_RETRIEVAL_ERROR'
    });
  }
};

// 북마크 수정 (노트와 알림 설정)
const updateBookmark = async (req, res) => {
  try {
    const { bookmark_id } = req.params;
    const { note, notification } = req.body;
    const user_id = req.user.user_id;

    const bookmark = await Bookmark.findOne({
      where: { bookmark_id, user_id }
    });

    if (!bookmark) {
      return res.status(404).json({
        status: 'error',
        message: '북마크를 찾을 수 없습니다',
        code: 'BOOKMARK_NOT_FOUND'
      });
    }

    const updateData = {
      updated_at: new Date()
    };

    if (note !== undefined) updateData.note = note;
    if (notification !== undefined) updateData.notification = notification;

    await bookmark.update(updateData);

    logger.info(`Bookmark updated: ${bookmark_id}`);

    res.json({
      status: 'success',
      data: {
        bookmark_id,
        note: bookmark.note,
        notification: bookmark.notification,
        updated_at: bookmark.updated_at
      }
    });
  } catch (error) {
    logger.error('Bookmark update error:', error);
    res.status(500).json({
      status: 'error',
      message: '북마크 수정 중 오류가 발생했습니다',
      code: 'BOOKMARK_UPDATE_ERROR'
    });
  }
};

// 북마크 상태 확인
const checkBookmarkStatus = async (req, res) => {
  try {
    const { job_id } = req.params;
    const user_id = req.user.user_id;

    const bookmark = await Bookmark.findOne({
      where: { user_id, job_id }
    });

    res.json({
      status: 'success',
      data: {
        bookmarked: !!bookmark,
        bookmark_id: bookmark?.bookmark_id,
        note: bookmark?.note,
        notification: bookmark?.notification
      }
    });
  } catch (error) {
    logger.error('Bookmark status check error:', error);
    res.status(500).json({
      status: 'error',
      message: '북마크 상태 확인 중 오류가 발생했습니다',
      code: 'BOOKMARK_STATUS_ERROR'
    });
  }
};

module.exports = {
  toggleBookmark,
  getMyBookmarks,
  updateBookmark,
  checkBookmarkStatus
};