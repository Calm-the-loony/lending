const User = require('../models/User');
const { ALLOWED_ADMIN_EMAILS } = require('../config/constants');

const authController = {
  async login(req, res) {
    try {
      const { username, email, password } = req.body;
      
      // Определяем идентификатор для поиска
      const loginIdentifier = email || username;
      
      if (!loginIdentifier || !password) {
        return res.status(400).json({
          success: false,
          message: 'Имя пользователя/email и пароль обязательны'
        });
      }
      
      // Ищем пользователя
      const user = await User.findByEmailOrUsername(loginIdentifier);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Неверные учетные данные'
        });
      }
      
      // Проверяем, разрешен ли email для админки
      if (!ALLOWED_ADMIN_EMAILS.includes(user.email)) {
        return res.status(403).json({
          success: false,
          message: 'Доступ запрещен. У вас нет прав для доступа к админке.'
        });
      }
      
      // Проверяем пароль (упрощенная версия)
      if (password === 'daria' || password === 'admin123') {
        // Создаем токен
        const tokenData = Buffer.from(JSON.stringify({
          username: user.username,
          email: user.email,
          role: user.role,
          timestamp: Date.now()
        })).toString('base64');
        
        const token = `admin_token_${tokenData}`;
        
        res.json({
          success: true,
          message: 'Вход выполнен успешно',
          token: token,
          user: {
            username: user.username,
            email: user.email,
            role: user.role
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
  }
};

module.exports = authController;