const { ALLOWED_ADMIN_EMAILS } = require('../config/database');

// Middleware для аутентификации админа
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  console.log('Проверка аутентификации, токен:', token ? 'присутствует' : 'отсутствует');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Требуется авторизация'
    });
  }
  
  // Проверяем, что токен валидный и начинается с admin_token_
  if (token.startsWith('admin_token_')) {
    try {
      // Извлекаем email из токена
      const tokenData = token.split('_').slice(2).join('_');
      const decoded = JSON.parse(Buffer.from(tokenData, 'base64').toString());
      
      console.log('Декодированный токен:', decoded);
      
      // Проверяем, что email разрешен для админки
      if (ALLOWED_ADMIN_EMAILS.includes(decoded.email)) {
        req.user = { 
          username: decoded.username || 'admin', 
          email: decoded.email,
          role: 'admin' 
        };
        next();
      } else {
        return res.status(403).json({
          success: false,
          message: 'Доступ запрещен. У вас нет прав для доступа к админке.'
        });
      }
    } catch (error) {
      console.error('Ошибка декодирования токена:', error);
      return res.status(401).json({
        success: false,
        message: 'Неверный токен'
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: 'Неверный токен'
    });
  }
};

module.exports = {
  authenticate
};