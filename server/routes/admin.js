const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// Все админские роуты требуют аутентификации
router.use(authenticate);

// Статистика
router.get('/api/admin/statistics', adminController.getStatistics);

// Заявки
router.get('/api/admin/bookings', adminController.getBookings);
router.put('/api/admin/bookings/:id/status', adminController.updateBookingStatus);
router.delete('/api/admin/bookings/:id', adminController.deleteBooking);

// Отзывы
router.get('/api/admin/reviews', adminController.getReviews);
router.put('/api/admin/reviews/:id/status', adminController.updateReviewStatus);
router.delete('/api/admin/reviews/:id', adminController.deleteReview);

module.exports = router;