const { Bookmark, Job, User } = require('../models');
const logger = require('../utils/logger');

// 공통 에러 핸들링 함수
const handleError = (res, message, code, error) => {
  logger.error(`${message}:`, error);
  res.status(500).json({
    status: 'error',
    message,
    code,
  });
};

// 북마크 생성 및 토글
const toggleBookmark = async (req, res) => {
  try {
    console.log('Request user:', req.user); // req.user 디버깅
    const { job_id } = req.body;
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(400).json({
        status: 'error',
        message: 'User ID is missing. Ensure you are logged in.',
        code: 'USER_ID_MISSING',
      });
    }

    if (!job_id) {
      return res.status(400).json({
        status: 'error',
        message: 'Job ID is required',
        code: 'JOB_ID_MISSING',
      });
    }

    const existingBookmark = await Bookmark.findOne({ where: { user_id, job_id } });

    if (existingBookmark) {
      await existingBookmark.destroy();
      return res.json({
        status: 'success',
        message: '북마크가 삭제되었습니다.',
      });
    }

    const newBookmark = await Bookmark.create({ user_id, job_id });
    res.json({
      status: 'success',
      message: '북마크가 생성되었습니다.',
      data: newBookmark,
    });
  } catch (error) {
    console.error('북마크 토글 오류:', error.message);
    res.status(500).json({
      status: 'error',
      message: '북마크 토글 중 오류가 발생했습니다',
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
      include: [
        {
          model: Job,
          attributes: ['title', 'company_id', 'location', 'salary', 'experience'],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      status: 'success',
      data: {
        bookmarks,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_items: count,
        },
      },
    });
  } catch (error) {
    handleError(res, '북마크 목록 조회 중 오류가 발생했습니다', 'BOOKMARK_RETRIEVAL_ERROR', error);
  }
};

// 북마크 업데이트
const updateBookmark = async (req, res) => {
  try {
    const { bookmark_id } = req.params;
    const { note, notification } = req.body;

    const bookmark = await Bookmark.findByPk(bookmark_id);

    if (!bookmark) {
      return res.status(404).json({
        status: 'error',
        message: '북마크를 찾을 수 없습니다.',
        code: 'BOOKMARK_NOT_FOUND',
      });
    }

    // 북마크 정보 업데이트
    bookmark.note = note !== undefined ? note : bookmark.note;
    bookmark.notification = notification !== undefined ? notification : bookmark.notification;

    await bookmark.save();

    res.json({
      status: 'success',
      message: '북마크가 업데이트되었습니다.',
      data: bookmark,
    });
  } catch (error) {
    handleError(res, '북마크 업데이트 중 오류가 발생했습니다', 'BOOKMARK_UPDATE_ERROR', error);
  }
};

// 북마크 상태 확인
const checkBookmarkStatus = async (req, res) => {
  try {
    const { job_id } = req.params;
    const user_id = req.user.user_id;

    const bookmark = await Bookmark.findOne({
      where: { user_id, job_id },
    });

    res.json({
      status: 'success',
      data: {
        bookmarked: !!bookmark,
        bookmark_id: bookmark?.bookmark_id,
        note: bookmark?.note,
        notification: bookmark?.notification,
      },
    });
  } catch (error) {
    handleError(res, '북마크 상태 확인 중 오류가 발생했습니다', 'BOOKMARK_STATUS_ERROR', error);
  }
};

// 모듈 내보내기
module.exports = {
  toggleBookmark,
  getMyBookmarks,
  updateBookmark,
  checkBookmarkStatus,
};
