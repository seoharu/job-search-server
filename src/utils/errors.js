class CustomError extends Error {
  constructor(message, statusCode, errorCode) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

class AuthenticationError extends CustomError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTH_ERROR');
  }
}

class ValidationError extends CustomError {
  constructor(message = 'Invalid data format') {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

class NotFoundError extends CustomError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

class DatabaseError extends CustomError {
  constructor(message = 'Database operation failed') {
    super(message, 500, 'DB_ERROR');
  }
}

module.exports = {
  CustomError,
  AuthenticationError,
  ValidationError,
  NotFoundError,
  DatabaseError
};