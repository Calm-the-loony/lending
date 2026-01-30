const pool = require('../config/database');

const Booking = {
  async create(data) {
    const {
      name, email, phone, service, level, ageGroup,
      frequency, message, agreeTerms, agreeNewsletter
    } = data;
    
    const [result] = await pool.execute(
      `INSERT INTO bookings 
       (name, email, phone, service, level, age_group, frequency, message, agree_terms, agree_newsletter) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(), email.trim(), phone.trim(), service, level || null,
        ageGroup || null, frequency || null, message || null,
        agreeTerms ? 1 : 0, agreeNewsletter ? 1 : 0
      ]
    );
    
    return result.insertId;
  },

  async getAll({ page = 1, limit = 10, status = null }) {
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM bookings';
    let countQuery = 'SELECT COUNT(*) as total FROM bookings';
    const params = [];
    const countParams = [];

    if (status && status !== 'all') {
      query += ' WHERE status = ?';
      countQuery += ' WHERE status = ?';
      params.push(status);
      countParams.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [bookings] = await pool.execute(query, params);
    const [[{ total }]] = await pool.execute(countQuery, countParams);

    return {
      bookings,
      pagination: {
        total: parseInt(total),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    };
  },

  async updateStatus(id, status) {
    await pool.execute(
      'UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );
  },

  async delete(id) {
    await pool.execute('DELETE FROM bookings WHERE id = ?', [id]);
  },

  async getStats() {
    const [[stats]] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new,
        SUM(CASE WHEN status = 'contacted' THEN 1 ELSE 0 END) as contacted,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
      FROM bookings
    `);
    
    return {
      total: parseInt(stats.total) || 0,
      new: parseInt(stats.new) || 0,
      contacted: parseInt(stats.contacted) || 0,
      confirmed: parseInt(stats.confirmed) || 0,
      completed: parseInt(stats.completed) || 0,
      cancelled: parseInt(stats.cancelled) || 0
    };
  }
};

module.exports = Booking;