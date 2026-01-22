const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tutor_website',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10
});

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Требуется авторизация'
    });
  }
  
  if (token.startsWith('admin_token_')) {
    req.user = { username: 'admin', role: 'admin' };
    next();
  } else {
    return res.status(401).json({
      success: false,
      message: 'Неверный токен'
    });
  }
};

// ============ ПУБЛИЧНЫЕ РОУТЫ ============

app.get('/', (req, res) => {
  res.json({ 
    message: '✅ LinguaPro API работает!',
    endpoints: {
      public: {
        bookings: 'POST /api/bookings',
        reviews: 'POST /api/reviews, GET /api/reviews'
      },
      admin: {
        login: 'POST /api/admin/login',
        bookings: 'GET /api/admin/bookings',
        reviews: 'GET /api/admin/reviews',
        updateReview: 'PUT /api/admin/reviews/:id/status',
        deleteReview: 'DELETE /api/admin/reviews/:id',
        statistics: 'GET /api/admin/statistics'
      }
    }
  });
});

app.post('/api/bookings', async (req, res) => {
  try {
    const { name, email, phone, service, level, ageGroup, frequency, message, agreeTerms, agreeNewsletter } = req.body;

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

    const [result] = await pool.execute(
      `INSERT INTO bookings (name, email, phone, service, level, age_group, frequency, message, agree_terms, agree_newsletter) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name.trim(), email.trim(), phone.trim(), service, level || null, ageGroup || null, frequency || null, message || null, agreeTerms, agreeNewsletter || false]
    );

    res.status(201).json({
      success: true,
      message: 'Заявка отправлена!',
      data: { id: result.insertId }
    });

  } catch (error) {
    console.error('❌ Ошибка при отправке заявки:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

app.post('/api/reviews', async (req, res) => {
  try {
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
      'INSERT INTO reviews (name, position, text, rating, status) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), position?.trim() || null, text.trim(), rating, 'pending']
    );

    res.status(201).json({
      success: true,
      message: 'Отзыв отправлен на модерацию. Он появится на сайте после проверки.',
      data: { id: result.insertId }
    });

  } catch (error) {
    console.error('❌ Ошибка при отправке отзыва:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

app.get('/api/reviews', async (req, res) => {
  try {
    const [reviews] = await pool.execute(
      'SELECT * FROM reviews WHERE status = "approved" ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      data: reviews
    });

  } catch (error) {
    console.error('❌ Ошибка при получении отзывов:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// ============ АДМИН РОУТЫ ============

app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (username === 'admin' && password === 'admin123') {
      res.json({
        success: true,
        message: 'Вход выполнен',
        token: 'admin_token_' + Date.now(),
        user: { 
          username: 'admin', 
          email: 'anna@linguapro.ru',
          role: 'admin'
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Неверные учетные данные'
      });
    }
  } catch (error) {
    console.error('❌ Ошибка входа:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

app.get('/api/admin/bookings', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM bookings';
    let countQuery = 'SELECT COUNT(*) as total FROM bookings';
    const params = [];
    const countParams = [];

    if (status) {
      query += ' WHERE status = ?';
      countQuery += ' WHERE status = ?';
      params.push(status);
      countParams.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [bookings] = await pool.execute(query, params);
    const [[{ total }]] = await pool.execute(countQuery, countParams);

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('❌ Ошибка при получении заявок:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

app.put('/api/admin/bookings/:id/status', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!['new', 'contacted', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Недопустимый статус'
      });
    }

    await pool.execute(
      'UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );

    if (notes) {
      await pool.execute(
        'INSERT INTO booking_notes (booking_id, notes) VALUES (?, ?)',
        [id, notes]
      );
    }

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
});

app.delete('/api/admin/bookings/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.execute('DELETE FROM bookings WHERE id = ?', [id]);

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
});

app.get('/api/admin/reviews', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM reviews';
    let countQuery = 'SELECT COUNT(*) as total FROM reviews';
    const params = [];
    const countParams = [];

    if (status) {
      query += ' WHERE status = ?';
      countQuery += ' WHERE status = ?';
      params.push(status);
      countParams.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [reviews] = await pool.execute(query, params);
    const [[{ total }]] = await pool.execute(countQuery, countParams);

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('❌ Ошибка при получении отзывов:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

app.put('/api/admin/reviews/:id/status', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Недопустимый статус'
      });
    }

    await pool.execute(
      'UPDATE reviews SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );

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
});

app.delete('/api/admin/reviews/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.execute('DELETE FROM reviews WHERE id = ?', [id]);

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
});

app.get('/api/admin/statistics', authenticate, async (req, res) => {
  try {
    // Статистика по заявкам
    const [[bookingStats]] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        COALESCE(SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END), 0) as new,
        COALESCE(SUM(CASE WHEN status = 'contacted' THEN 1 ELSE 0 END), 0) as contacted,
        COALESCE(SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END), 0) as confirmed,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) as completed,
        COALESCE(SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END), 0) as cancelled
      FROM bookings
    `);

    // Статистика по отзывам
    const [[reviewStats]] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        COALESCE(AVG(rating), 0) as avg_rating,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) as pending,
        COALESCE(SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END), 0) as approved,
        COALESCE(SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END), 0) as rejected
      FROM reviews
    `);

    res.json({
      success: true,
      data: {
        bookings: {
          total: parseInt(bookingStats.total) || 0,
          new: parseInt(bookingStats.new) || 0,
          contacted: parseInt(bookingStats.contacted) || 0,
          confirmed: parseInt(bookingStats.confirmed) || 0,
          completed: parseInt(bookingStats.completed) || 0,
          cancelled: parseInt(bookingStats.cancelled) || 0
        },
        reviews: {
          total: parseInt(reviewStats.total) || 0,
          avgRating: parseFloat(reviewStats.avg_rating) || 0,
          pending: parseInt(reviewStats.pending) || 0,
          approved: parseInt(reviewStats.approved) || 0,
          rejected: parseInt(reviewStats.rejected) || 0
        }
      }
    });
  } catch (error) {
    console.error('❌ Ошибка при получении статистики:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Обработка 404 для всех остальных роутов
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Роут не найден'
  });
});

const startServer = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Подключение к MySQL успешно');
    connection.release();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n🚀 Сервер запущен на порту ${PORT}`);
      console.log(`🔗 http://localhost:${PORT}`);
      console.log(`🌐 Доступен по IP: http://0.0.0.0:${PORT}`);
      console.log(`🔐 Админ панель: http://localhost:3000/admin`);
      console.log('\n👤 Админ данные:');
      console.log('   Имя пользователя: admin');
      console.log('   Пароль: admin123');
    });

  } catch (error) {
    console.error('\n❌ Ошибка подключения к MySQL:', error.message);
    console.error('Проверьте:');
    console.error('1. Запущен ли MySQL сервер');
    console.error('2. Правильность данных в .env файле');
    console.error('3. Существует ли база данных tutor_website');
    process.exit(1);
  }
};

startServer();