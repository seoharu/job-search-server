// services/bookmarkService.js
const { Bookmark, Job } = require('../models');
const logger = require('../utils/logger');

class BookmarkService {
  // 북마크 추가/제거
  async toggleBookmark(user_id, job_id, note = null, notification = false) {
    try {
      const existingBookmark = await Bookmark.findOne({
        where: { user_id, job_id }
      });

      if (existingBookmark) {
        await existingBookmark.destroy();
        logger.info(`Bookmark removed: ${existingBookmark.bookmark_id}`);
        return {
          bookmarked: false,
          message: '북마크가 제거되었습니다'
        };
      }

      const bookmark = await Bookmark.create({
        user_id,
        job_id,
        note,
        notification,
        created_at: new Date(),
        updated_at: new Date()
      });

      logger.info(`Bookmark created: ${bookmark.bookmark_id}`);
      return {
        bookmarked: true,
        bookmark_id: bookmark.bookmark_id,
        created_at: bookmark.created_at
      };
    } catch (error) {
      logger.error('Bookmark toggle error:', error);
      throw error;
    }
  }

  // 북마크 목록 조회
  async getBookmarks(user_id, { page = 1, limit = 20 }) {
    try {
      const { count, rows } = await Bookmark.findAndCountAll({
        where: { user_id },
        include: [{
          model: Job,
          attributes: ['title', 'company', 'location', 'salary']
        }],
        limit: parseInt(limit),
        offset: (page - 1) * parseInt(limit),
        order: [['created_at', 'DESC']]
      });

      return {
        bookmarks: rows,
        pagination: {
          total: count,
          current_page: page,
          total_pages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      logger.error('Bookmarks retrieval error:', error);
      throw error;
    }
  }

  // 북마크 수정
  async updateBookmark(bookmark_id, user_id, { note, notification }) {
    try {
      const bookmark = await Bookmark.findOne({
        where: { bookmark_id, user_id }
      });

      if (!bookmark) {
        throw new Error('북마크를 찾을 수 없습니다');
      }

      await bookmark.update({
        note,
        notification,
        updated_at: new Date()
      });

      logger.info(`Bookmark updated: ${bookmark_id}`);
      return bookmark;
    } catch (error) {
      logger.error('Bookmark update error:', error);
      throw error;
    }
  }

  // 북마크 상태 확인
  async checkBookmarkStatus(user_id, job_id) {
    try {
      const bookmark = await Bookmark.findOne({
        where: { user_id, job_id }
      });

      return {
        bookmarked: !!bookmark,
        bookmark_id: bookmark?.bookmark_id,
        note: bookmark?.note,
        notification: bookmark?.notification
      };
    } catch (error) {
      logger.error('Bookmark status check error:', error);
      throw error;
    }
  }
}

module.exports = new BookmarkService();