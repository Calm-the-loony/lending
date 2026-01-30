const Booking = require('../models/Booking');
const Review = require('../models/Review');

const adminController = {
  async getStatistics(req, res) {
    try {
      const bookingStats = await Booking.getStats();
      const reviewStats = await Review.getStats();
      
      const statistics = {
        bookings: bookingStats,
        reviews: reviewStats
      };
      
      res.json({
        success: true,
        data: statistics,
        user: req.user
      });
    } catch (error) {
      console.error('❌ Ошибка при получении статистики:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка сервера'
      });
    }
  },

  async getBookings(req, res) {
    try {
      const { page = 1, limit = 10, status } = req.query;
      
      const result = await Booking.getAll({ page, limit, status });
      
      res.json({
        success: true,
        data: result,
        user: req.user
      });
    } catch (error) {
      console.error('❌ Ошибка при получении заявок:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка сервера'
      });
    }
  },

  async updateBookingStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = ['new', 'contacted', 'confirmed', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Недопустимый статус'
        });
      }

      await Booking.updateStatus(id, status);

      res.json({
        success: true,
        message: 'Статус заявки обновлен'
      });
    } catch (error) {
      console.error('❌ Ошибка при обновлении статуса:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка сервера'
      });
    }
  },

  async deleteBooking(req, res) {
    try {
      const { id } = req.params;
      
      await Booking.delete(id);

      res.json({
        success: true,
        message: 'Заявка удалена'
      });
    } catch (error) {
      console.error('❌ Ошибка при удалении заявки:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка сервера'
      });
    }
  },

  async getReviews(req, res) {
    try {
      const { page = 1, limit = 10, status } = req.query;
      
      const result = await Review.getAll({ page, limit, status });
      
      res.json({
        success: true,
        data: result,
        user: req.user
      });
    } catch (error) {
      console.error('❌ Ошибка при получении отзывов:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка сервера'
      });
    }
  },

  async updateReviewStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Недопустимый статус'
        });
      }

      await Review.updateStatus(id, status);

      res.json({
        success: true,
        message: `Отзыв ${status === 'approved' ? 'одобрен' : 'отклонен'}`
      });
    } catch (error) {
      console.error('❌ Ошибка при обновлении статуса:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка сервера'
      });
    }
  },

  async deleteReview(req, res) {
    try {
      const { id } = req.params;
      
      await Review.delete(id);

      res.json({
        success: true,
        message: 'Отзыв удален'
      });
    } catch (error) {
      console.error('❌ Ошибка при удалении отзыва:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка сервера'
      });
    }
  }
};

module.exports = adminController;