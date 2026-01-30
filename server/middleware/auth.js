const { ALLOWED_ADMIN_EMAILS } = require('../config/constants');

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Требуется авторизация'
    });
  }
  
  if (token.startsWith('admin_token_')) {
    try {
      const tokenData = token.split('_').slice(2).join('_');
      const decoded = JSON.parse(Buffer.from(tokenData, 'base64').toString());
      
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

module.exports = { authenticate };