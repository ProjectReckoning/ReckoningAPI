const Redis = require('ioredis');
const logger = require('../helpers/utils/logger');
const config = require('./index');

const redis = new Redis({
  host: config.get('/redis/host'),
  port: config.get('/redis/port'),
  username: config.get('/redis/username'),
  password: config.get('/redis/password'),
  db: config.get('/redis/db')
});

redis.on('connect', () => {
  logger.info('Redis connected');
});

redis.on('error', (err) => {
  logger.error('Redis error:', err);
});

module.exports = redis;