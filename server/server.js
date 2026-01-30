const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Импорт роутов
const routes = require('./routes');

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
const startServer = async () => {
  try {
    // Инициализация БД
    const { initDatabase } = require('./utils/database');
    await initDatabase();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`
🚀 Сервер запущен на порту ${PORT}
🔗 Основные URL:
   http://localhost:${PORT}
   http://127.0.0.1:${PORT}

📊 Проверить БД: http://localhost:${PORT}/api/check-db
📝 Отзывы: http://localhost:${PORT}/api/reviews
🔐 Админ панель: http://localhost:3000/admin

👤 Админ данные:
   Email: daria.gritsaenko2000@gmail.com
   Пароль: daria
      `);
    });
  } catch (error) {
    console.error('\n❌ Ошибка запуска сервера:', error.message);
    process.exit(1);
  }
};

startServer();