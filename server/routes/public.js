const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Главная страница API
router.get('/', (req, res) => {
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
});

// Проверка БД и таблиц
router.get('/api/check-db', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    const [tables] = await connection.execute("SHOW TABLES");
    const [bookingsCount] = await connection.execute("SELECT COUNT(*) as count FROM bookings");
    const [reviewsCount] = await connection.execute("SELECT COUNT(*) as count FROM reviews");
    const [reviewsList] = await connection.execute("SELECT id, name, status, rating FROM reviews");
    
    connection.release();
    
    res.json({
      success: true,
      database: process.env.DB_NAME || 'tutor_website',
      tables: tables.map(t => Object.values(t)[0]),
      counts: {
        bookings: bookingsCount[0].count,
        reviews: reviewsCount[0].count
      },
      reviews: reviewsList
    });
  } catch (error) {
    console.error('❌ Ошибка проверки БД:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка подключения к БД',
      error: error.message
    });
  }
});

// Отправка заявки
router.post('/api/bookings', async (req, res) => {
  console.log('📥 Получена новая заявка:', req.body);
  
  try {
    const { 
      name, 
      email, 
      phone, 
      service, 
      level, 
      ageGroup, 
      frequency, 
      message, 
      agreeTerms, 
      agreeNewsletter 
    } = req.body;

    // Валидация обязательных полей
    if (!name || !email || !phone || !service) {
      return res.status(400).json({
        success: false,
        message: 'Заполните все обязательные поля'
      });
    }

    if (!agreeTerms) {
      return res.status(400).json({
        success: false,
        message: 'Необходимо согласие на обработку данных'
      });
    }

    // Валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Введите корректный email'
      });
    }

    // Сохранение в БД
    const [result] = await pool.execute(
      `INSERT INTO bookings 
       (name, email, phone, service, level, age_group, frequency, message, agree_terms, agree_newsletter) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(), 
        email.trim(), 
        phone.trim(), 
        service, 
        level || null, 
        ageGroup || null, 
        frequency || null, 
        message || null, 
        agreeTerms ? 1 : 0, 
        agreeNewsletter ? 1 : 0
      ]
    );

    console.log(`✅ Заявка #${result.insertId} сохранена`);
    
    res.status(201).json({
      success: true,
      message: 'Заявка успешно отправлена! Я свяжусь с вами в течение 24 часов.',
      data: { 
        id: result.insertId,
        name: name.trim()
      }
    });

  } catch (error) {
    console.error('❌ Ошибка при сохранении заявки:', error);
    
    // Детальный лог ошибок MySQL
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.error('Таблица bookings не существует! Создаю...');
      // Таблицы будут созданы при запуске сервера
      
      return res.status(503).json({
        success: false,
        message: 'База данных обновляется. Пожалуйста, попробуйте через 30 секунд.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при сохранении заявки',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Получение опубликованных отзывов
router.get('/api/reviews', async (req, res) => {
  try {
    console.log('📨 Запрос на получение отзывов получен');
    
    const [reviews] = await pool.execute(
      `SELECT id, name, position, text, rating, status, created_at 
       FROM reviews 
       WHERE status = 'approved' 
       ORDER BY created_at DESC 
       LIMIT 50`
    );

    console.log(`✅ Найдено ${reviews.length} одобренных отзывов`);
    
    // Если нет approved отзывов, показываем pending для отладки
    if (reviews.length === 0) {
      console.log('⚠️  Нет одобренных отзывов, показываю все...');
      const [allReviews] = await pool.execute(
        `SELECT id, name, position, text, rating, status, created_at 
         FROM reviews 
         ORDER BY created_at DESC 
         LIMIT 50`
      );
      
      console.log(`Найдено всего отзывов: ${allReviews.length}`);
      
      return res.json({
        success: true,
        message: 'Нет одобренных отзывов, показываю все',
        data: allReviews
      });
    }

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
});

// Отправка отзыва
router.post('/api/reviews', async (req, res) => {
  try {
    console.log('📝 Получен новый отзыв:', req.body);
    
    const { name, position, text, rating } = req.body;

    if (!name || !text || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Заполните все обязательные поля'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Оценка должна быть от 1 до 5'
      });
    }

    const [result] = await pool.execute(
      'INSERT INTO reviews (name, position, text, rating) VALUES (?, ?, ?, ?)',
      [name.trim(), position?.trim() || null, text.trim(), parseInt(rating)]
    );

    console.log(`✅ Отзыв #${result.insertId} сохранен`);
    
    res.status(201).json({
      success: true,
      message: 'Отзыв отправлен на модерацию. Он появится на сайте после проверки.',
      data: { id: result.insertId }
    });

  } catch (error) {
    console.error('❌ Ошибка при отправке отзыва:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при сохранении отзыва',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;