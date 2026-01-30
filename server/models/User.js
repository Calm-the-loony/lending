const pool = require('../config/database');

const User = {
  async findByEmailOrUsername(identifier) {
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE email = ? OR username = ?',
      [identifier, identifier]
    );
    
    return users[0] || null;
  },

  async create(data) {
    const { username, email, password, role = 'user' } = data;
    
    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, password, role]
    );
    
    return result.insertId;
  }
};

module.exports = User;