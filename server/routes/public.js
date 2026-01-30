const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

// Главная страница
router.get('/', publicController.getHome);

// Проверка БД
router.get('/api/check-db', publicController.checkDatabase);

// Заявки
router.post('/api/bookings', publicController.createBooking);

// Отзывы
router.get('/api/reviews', publicController.getReviews);
router.post('/api/reviews', publicController.createReview);

module.exports = router;