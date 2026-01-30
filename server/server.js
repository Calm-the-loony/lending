const express = require('express');
const cors = require('cors');
require('dotenv').config();

const routes = require('./routes');
const { logger } = require('./middleware/logger');

const app = express();
const PORT = process.env.PORT || 5000;

// Настройка CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Middleware для логирования запросов
app.use(logger);

// Подключение роутов
app.use('/', routes);

// Обработка 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Роут не найден'
  });
});

// Глобальная обработка ошибок
app.use((err, req, res, next) => {
  console.error('🔥 Глобальная ошибка:', err);
  res.status(500).json({
    success: false,
    message: 'Внутренняя ошибка сервера',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
🚀 Сервер запущен на порту ${PORT}
🔗 Основные URL:
   http://localhost:${PORT}
   http://127.0.0.1:${PORT}

📊 Проверить БД: http://localhost:${PORT}/api/check-db
📝 Отзывы: http://localhost:${PORT}/api/reviews
🔐 Админ панель: http://localhost:3000/admin

👤 Админ данные (можно использовать любой вариант):
   Вариант 1:
     Username/Email: daria
     Пароль: daria

   Вариант 2:
     Username/Email: daria.gritsaenko2000@gmail.com
     Пароль: daria

   Вариант 3:
     Username/Email: admin
     Пароль: admin123
      `);
});