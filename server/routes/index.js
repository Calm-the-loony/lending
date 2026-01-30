const express = require('express');
const router = express.Router();
const logger = require('../middleware/logger');

// Middleware логирования
router.use(logger);

// Импорт роутов
const publicRoutes = require('./public');
const adminRoutes = require('./admin');
const authController = require('../controllers/authController');

// Подключение роутов
router.use('/', publicRoutes);

// Аутентификация
router.post('/api/admin/login', authController.login);

// Админские роуты
router.use('/', adminRoutes);

module.exports = router;