require('dotenv').config();
const confidence = require('confidence');

const config = {
  port: process.env.PORT,
  authentication: process.env.TOKEN_SECRET,
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    db: process.env.REDIS_DB
  }
};

const store = new confidence.Store(config);

exports.get = (key) => store.get(key);