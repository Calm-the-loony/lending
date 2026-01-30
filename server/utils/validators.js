function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateRating(rating) {
  return rating >= 1 && rating <= 5;
}

function validateBookingData(data) {
  const { name, email, phone, service, agreeTerms } = data;
  
  const errors = [];
  
  if (!name) errors.push('Имя обязательно');
  if (!email) errors.push('Email обязателен');
  if (!phone) errors.push('Телефон обязателен');
  if (!service) errors.push('Услуга обязательна');
  if (!agreeTerms) errors.push('Необходимо согласие на обработку данных');
  
  if (email && !validateEmail(email)) {
    errors.push('Введите корректный email');
  }
  
  return errors;
}

function validateReviewData(data) {
  const { name, text, rating } = data;
  
  const errors = [];
  
  if (!name) errors.push('Имя обязательно');
  if (!text) errors.push('Текст отзыва обязателен');
  if (!rating) errors.push('Оценка обязательна');
  
  if (rating && !validateRating(parseInt(rating))) {
    errors.push('Оценка должна быть от 1 до 5');
  }
  
  return errors;
}

module.exports = {
  validateEmail,
  validateRating,
  validateBookingData,
  validateReviewData
};