const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = Object.values(err.keyValue)[0];
  const message = `${value} already exists`;
  return new AppError(message, 400);
};

const handleJWTError = (err) =>
  new AppError(
    'Invalid token, Please login again',
    401,
  );

const handleJWTExpiredError = (err) =>
  new AppError(
    'Token expired, Please login again',
    401,
  );
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(
    (el) => el.message,
  );
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const sendErrorDev = (err, req, res) => {
  // API
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    // RENDERED WEBSITE
    console.error('ERROR: ', err);
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      msg: err.message,
    });
  }
};

const sendErrorProd = (err, req, res) => {
  // API
  //Operational, trusted error: send message to client
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
      // Programming or other unknown error: dont send message to client
    }
    console.error('ERROR: ', err);
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong',
    });
  }
  // RENDERED WEBSITE
  if (err.isOperational) {
    return res
      .status(err.statusCode)
      .render('error', {
        title: 'Something went wrong',
        msg: err.message,
      });
    // Programming or other unknown error: dont send message to client
  }
  console.error('ERROR: ', err);
  return res
    .status(err.statusCode)
    .render('error', {
      title: 'Something went wrong',
      msg: 'Please try again later',
    });
};

module.exports = (err, req, res, next) => {
  console.log(err.stack);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (
    process.env.NODE_ENV === 'production'
  ) {
    let error = Object.assign(err);
    if (error.name === 'CastError')
      error = handleCastErrorDB(error);
    if (error.code === 11000)
      error = handleDuplicateFieldsDB(error);

    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);

    if (error.name === 'JsonWebTokenError')
      error = handleJWTError(error);

    if (error.name === 'TokenExpiredError')
      error = handleJWTExpiredError(error);

    sendErrorProd(error, req, res);
  }
};
