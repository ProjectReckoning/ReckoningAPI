require('dotenv').config();
const confidence = require('confidence');

const config = {
  port: process.env.PORT,
  authentication: process.env.TOKEN_SECRET,
};

const store = new confidence.Store(config);

exports.get = (key) => store.get(key);