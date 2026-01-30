const logger = (req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  if (Object.keys(req.body).length > 0) {
    console.log('Body:', req.body);
  }
  next();
};

module.exports = logger;