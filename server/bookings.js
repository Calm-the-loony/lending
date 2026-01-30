module.exports = (pool) => {
  return {
    // Создание заявки (публичное)
    create: async (req, res) => {
      try {
        const { 
          name, email, phone, service, level, ageGroup, 
          frequency, message, agreeTerms, agreeNewsletter 
        } = req.body;
        
        // Валидация
        if (!name || !email || !phone || !service || !agreeTerms) {
          return res.status(400).json({ error: 'Заполните все обязательные поля' });
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({ error: 'Некорректный email' });
        }
        
        // Сохранение
        const [result] = await pool.execute(
          `INSERT INTO bookings 
           (name, email, phone, service, level, age_group, frequency, message, agree_terms, agree_newsletter) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            name.trim(), email.trim(), phone.trim(), service, 
            level || null, ageGroup || null, frequency || null, 
            message || null, agreeTerms ? 1 : 0, agreeNewsletter ? 1 : 0
          ]
        );
        
        console.log(`✅ Заявка #${result.insertId} сохранена`);
        
        res.status(201).json({
          success: true,
          message: 'Заявка успешно отправлена!',
          data: { id: result.insertId, name: name.trim() }
        });
      } catch (error) {
        console.error('❌ Ошибка заявки:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
      }
    },

    // Получение заявок (админ)
    getAdmin: async (req, res) => {
      try {
        const { page = 1, limit = 10, status } = req.query;
        const offset = (page - 1) * limit;
        
        let query = 'SELECT * FROM bookings';
        let countQuery = 'SELECT COUNT(*) as total FROM bookings';
        const params = [];
        
        if (status && status !== 'all') {
          query += ' WHERE status = ?';
          countQuery += ' WHERE status = ?';
          params.push(status);
        }
        
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));
        
        const [bookings] = await pool.execute(query, params);
        const [[{ total }]] = await pool.execute(countQuery, params.slice(0, -2));
        
        res.json({
          success: true,
          data: {
            bookings,
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
        console.error('❌ Ошибка получения заявок:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
      }
    },

    // Обновление статуса
    updateStatus: async (req, res) => {
      try {
        const { id } = req.params;
        const { status } = req.body;
        
        const validStatuses = ['new', 'contacted', 'confirmed', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({ error: 'Недопустимый статус' });
        }
        
        await pool.execute(
          'UPDATE bookings SET status = ? WHERE id = ?',
          [status, id]
        );
        
        res.json({ success: true, message: 'Статус обновлен' });
      } catch (error) {
        console.error('❌ Ошибка обновления:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
      }
    },

    // Удаление заявки
    delete: async (req, res) => {
      try {
        const { id } = req.params;
        await pool.execute('DELETE FROM bookings WHERE id = ?', [id]);
        res.json({ success: true, message: 'Заявка удалена' });
      } catch (error) {ы
        console.error('❌ Ошибка удаления:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
      }
    }
  };
};