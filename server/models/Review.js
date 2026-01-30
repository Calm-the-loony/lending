const pool = require('../config/database');

const Review = {
  async create(data) {
    const { name, position, text, rating } = data;
    
    const [result] = await pool.execute(
      'INSERT INTO reviews (name, position, text, rating) VALUES (?, ?, ?, ?)',
      [name.trim(), position?.trim() || null, text.trim(), parseInt(rating)]
    );
    
    return result.insertId;
  },

  async getPublished() {
    const [reviews] = await pool.execute(
      `SELECT id, name, position, text, rating, status, created_at 
       FROM reviews 
       WHERE status = 'approved' 
       ORDER BY created_at DESC 
       LIMIT 50`
    );
    
    return reviews;
  },

  async getAll({ page = 1, limit = 10, status = null }) {
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM reviews';
    let countQuery = 'SELECT COUNT(*) as total FROM reviews';
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

    const [reviews] = await pool.execute(query, params);
    const [[{ total }]] = await pool.execute(countQuery, countParams);

    return {
      reviews,
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
      'UPDATE reviews SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );
  },

  async delete(id) {
    await pool.execute('DELETE FROM reviews WHERE id = ?', [id]);
  },

  async getStats() {
    const [[stats]] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        ROUND(AVG(rating), 1) as avg_rating,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM reviews
    `);
    
    return {
      total: parseInt(stats.total) || 0,
      avgRating: parseFloat(stats.avg_rating) || 0,
      pending: parseInt(stats.pending) || 0,
      approved: parseInt(stats.approved) || 0,
      rejected: parseInt(stats.rejected) || 0
    };
  }
};

module.exports = Review;