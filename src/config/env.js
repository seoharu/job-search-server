const dotenv = require('dotenv');
const path = require('path');

const envPath = path.join(__dirname, '../../.env');

const result = dotenv.config({ path: envPath });

if (result.error) {
  throw new Error('Could not find .env file');
}

module.exports = {
  port: process.env.PORT,
  nodeEnv: process.env.NODE_ENV,
  db: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  },
  crawler: {
    interval: parseInt(process.env.CRAWL_INTERVAL),
    retryAttempts: parseInt(process.env.CRAWL_RETRY_ATTEMPTS),
    concurrentLimit: parseInt(process.env.CRAWL_CONCURRENT_LIMIT),
  },
  logLevel: process.env.LOG_LEVEL,
};