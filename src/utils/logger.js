const winston = require('winston');
const path = require('path');

// 로그 포맷 정의
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.printf(({ level, message, timestamp }) => {
    return `${timestamp} ${level.toUpperCase()}: ${message}`;
  })
);

// 로거 생성
const logger = winston.createLogger({
  format: logFormat,
  transports: [
    // 콘솔 출력
    new winston.transports.Console({
      level: 'debug',
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      )
    }),
    // 에러 로그 파일
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error'
    }),
    // 모든 로그 파일
    new winston.transports.File({
      filename: path.join('logs', 'combined.log')
    })
  ]
});

// 개발 환경에서는 더 자세한 로그 출력
if (process.env.NODE_ENV !== 'production') {
  logger.debug = function(...args) {
    const message = args.join(' ');
    this.log({
      level: 'debug',
      message
    });
  };
}

module.exports = logger;