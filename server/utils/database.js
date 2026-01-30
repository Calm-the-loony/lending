const pool = require('../config/database');
const { ALLOWED_ADMIN_EMAILS } = require('../config/constants');

async function initDatabase() {
  try {
    const connection = await pool.getConnection();
    
    // Таблица пользователей
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_role (role)
      )
    `);
    
    // Создаем пользователя Daria если его нет
    const [existingUsers] = await connection.execute(
      "SELECT * FROM users WHERE email = 'daria.gritsaenko2000@gmail.com'"
    );
    
    if (existingUsers.length === 0) {
      const hashedPassword = '$2b$10$N9qo8uLOickgx2ZMRZoMy.Mrq7gq6J3q9Q7Z2Mq5Q8L...';
      
      await connection.execute(
        "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
        ['daria', 'daria.gritsaenko2000@gmail.com', hashedPassword, 'admin']
      );
      console.log('✅ Создан пользователь Daria для админки');
    }
    
    // Таблица заявок
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        service VARCHAR(100) NOT NULL,
        level VARCHAR(50),
        age_group VARCHAR(50),
        frequency VARCHAR(50),
        message TEXT,
        status VARCHAR(20) DEFAULT 'new',
        agree_terms BOOLEAN DEFAULT FALSE,
        agree_newsletter BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      )
    `);
    
    // Таблица отзывов
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        position VARCHAR(100),
        text TEXT NOT NULL,
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status (status),
        INDEX idx_rating (rating)
      )
    `);
    
    // Добавляем тестовые данные, если таблица пустая
    const [reviewCount] = await connection.execute("SELECT COUNT(*) as count FROM reviews");
    if (reviewCount[0].count === 0) {
      console.log('Добавляю тестовые отзывы...');
      await connection.execute(`
        INSERT INTO reviews (name, position, text, rating, status) VALUES
        ('Анна М.', 'Студентка', 'Начала с нуля, сейчас могу свободно общаться на бытовые темы. Процесс обучения построен очень логично.', 5, 'approved'),
        ('Максим С.', 'IT-специалист', 'Нужен был технический английский. Материал подобрали под мои задачи, результат за 4 месяца отличный.', 5, 'approved'),
        ('София К.', 'Путешественница', 'Преодолела языковой барьер, который был годами. Теперь в поездках чувствую себя увереннее.', 4, 'approved'),
        ('Иван П.', 'Бизнесмен', 'Корпоративное обучение для сотрудников. Результаты видны уже через месяц занятий.', 5, 'pending'),
        ('Мария Л.', 'Школьница', 'Подготовка к ЕГЭ. Объясняют понятно, много практики. Чувствую себя увереннее.', 4, 'approved')
      `);
    }
    
    // Таблица заметок к заявкам
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS booking_notes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        booking_id INT NOT NULL,
        notes TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
      )
    `);
    
    console.log('✅ База данных инициализирована');
    connection.release();
    
    return true;
  } catch (error) {
    console.error('❌ Ошибка инициализации БД:', error.message);
    throw error;
  }
}

async function checkDatabase() {
  try {
    const connection = await pool.getConnection();
    
    const [tables] = await connection.execute("SHOW TABLES");
    const [bookingsCount] = await connection.execute("SELECT COUNT(*) as count FROM bookings");
    const [reviewsCount] = await connection.execute("SELECT COUNT(*) as count FROM reviews");
    const [reviewsList] = await connection.execute("SELECT id, name, status, rating FROM reviews");
    
    connection.release();
    
    return {
      success: true,
      database: process.env.DB_NAME || 'tutor_website',
      tables: tables.map(t => Object.values(t)[0]),
      counts: {
        bookings: bookingsCount[0].count,
        reviews: reviewsCount[0].count
      },
      reviews: reviewsList
    };
  } catch (error) {
    throw error;
  }
}

module.exports = { initDatabase, checkDatabase };