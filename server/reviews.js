module.exports = (pool) => {
  return {
    // Получение опубликованных отзывов (публичное)
    getPublic: async (req, res) => {
      try {
        const [reviews] = await pool.execute(
          `SELECT id, name, position, text, rating, created_at 
           FROM reviews 
           WHERE status = 'approved' 
           ORDER BY created_at DESC 
           LIMIT 50`
        );
        
        res.json({ success: true, data: reviews });
      } catch (error) {
        console.error('❌ Ошибка получения отзывов:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
      }
    },

    // Создание отзыва (публичное)
    create: async (req, res) => {
      try {
        const { name, position, text, rating } = req.body;
        
        if (!name || !text || !rating || rating < 1 || rating > 5) {
          return res.status(400).json({ error: 'Неверные данные отзыва' });
        }
        
        const [result] = await pool.execute(
          'INSERT INTO reviews (name, position, text, rating) VALUES (?, ?, ?, ?)',
          [name.trim(), position?.trim() || null, text.trim(), parseInt(rating)]
        );
        
        console.log(`✅ Отзыв #${result.insertId} сохранен`);
        
        res.status(201).json({
          success: true,
          message: 'Отзыв отправлен на модерацию',
          data: { id: result.insertId }
        });
      } catch (error) {
        console.error('❌ Ошибка создания отзыва:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
      }
    },

    // Получение отзывов (админ)
    getAdmin: async (req, res) => {
      try {
        const { page = 1, limit = 10, status } = req.query;
        const offset = (page - 1) * limit;
        
        let query = 'SELECT * FROM reviews';
        let countQuery = 'SELECT COUNT(*) as total FROM reviews';
        const params = [];
        
        if (status && status !== 'all') {
          query += ' WHERE status = ?';
          countQuery += ' WHERE status = ?';
          params.push(status);
        }
        
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));
        
        const [reviews] = await pool.execute(query, params);
        const [[{ total }]] = await pool.execute(countQuery, params.slice(0, -2));
        
        res.json({
          success: true,
          data: {
            reviews,
            pagination: {
              total: parseInt(total),
              page: parseInt(page),
              limit: parseInt(limit),
              pages: Math.ceil(total / limit)
            }
          },
          user: req.user
        });
      } catch (error) {
        console.error('❌ Ошибка получения отзывов:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
      }
    },

    // Обновление статуса отзыва
    updateStatus: async (req, res) => {
      try {
        const { id } = req.params;
        const { status } = req.body;
        
        if (!['pending', 'approved', 'rejected'].includes(status)) {
          return res.status(400).json({ error: 'Недопустимый статус' });
        }
        
        await pool.execute(
          'UPDATE reviews SET status = ? WHERE id = ?',
          [status, id]
        );
        
        res.json({ 
          success: true, 
          message: `Отзыв ${status === 'approved' ? 'одобрен' : 'отклонен'}` 
        });
      } catch (error) {
        console.error('❌ Ошибка обновления:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
      }
    },

    // Удаление отзыва
    delete: async (req, res) => {
      try {
        const { id } = req.params;
        await pool.execute('DELETE FROM reviews WHERE id = ?', [id]);
        res.json({ success: true, message: 'Отзыв удален' });
      } catch (error) {
        console.error('❌ Ошибка удаления:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
      }
    }
  };
};