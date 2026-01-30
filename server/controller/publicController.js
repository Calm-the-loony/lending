const Booking = require('../models/Booking');
const Review = require('../models/Review');
const { checkDatabase } = require('../utils/database');
const { validateBookingData, validateReviewData } = require('../utils/validators');

const publicController = {
  async getHome(req, res) {
    res.json({ 
      message: '✅ LinguaPro API работает!',
      version: '1.0.0',
      endpoints: {
        public: {
          bookings: 'POST /api/bookings',
          reviews: 'POST /api/reviews, GET /api/reviews',
          checkDB: 'GET /api/check-db'
        },
        admin: {
          login: 'POST /api/admin/login',
          statistics: 'GET /api/admin/statistics',
          bookings: 'GET /api/admin/bookings',
          updateBooking: 'PUT /api/admin/bookings/:id/status',
          deleteBooking: 'DELETE /api/admin/bookings/:id',
          reviews: 'GET /api/admin/reviews',
          updateReview: 'PUT /api/admin/reviews/:id/status',
          deleteReview: 'DELETE /api/admin/reviews/:id'
        }
      }
    });
  },

  async checkDatabase(req, res) {
    try {
      const result = await checkDatabase();
      res.json(result);
    } catch (error) {
      console.error('❌ Ошибка проверки БД:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка подключения к БД',
        error: error.message
      });
    }
  },

  async createBooking(req, res) {
    try {
      const validationErrors = validateBookingData(req.body);
      
      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: validationErrors.join(', ')
        });
      }
      
      const bookingId = await Booking.create(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Заявка успешно отправлена! Я свяжусь с вами в течение 24 часов.',
        data: { 
          id: bookingId,
          name: req.body.name.trim()
        }
      });
    } catch (error) {
      console.error('❌ Ошибка при сохранении заявки:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка сервера при сохранении заявки',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  async getReviews(req, res) {
    try {
      const reviews = await Review.getPublished();
      
      res.json({
        success: true,
        data: reviews
      });
    } catch (error) {
      console.error('❌ Ошибка при получении отзывов:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка сервера при получении отзывов',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  async createReview(req, res) {
    try {
      const validationErrors = validateReviewData(req.body);
      
      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: validationErrors.join(', ')
        });
      }
      
      const reviewId = await Review.create(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Отзыв отправлен на модерацию. Он появится на сайте после проверки.',
        data: { id: reviewId }
      });
    } catch (error) {
      console.error('❌ Ошибка при отправке отзыва:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка сервера при сохранении отзыва',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

module.exports = publicController;