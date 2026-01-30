const mysql = require('mysql2/promise');

// Создание пула подключений к MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tutor_website',
  port: process.env.DB_PORT || 3307,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Разрешенные email для входа в админку
const ALLOWED_ADMIN_EMAILS = ['daria.gritsaenko2000@gmail.com'];

module.exports = {
  pool,
  ALLOWED_ADMIN_EMAILS
};