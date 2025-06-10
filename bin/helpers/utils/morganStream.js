const logger = require('./logger');

const morganStream = {
  write: (message) => {
    // Use info level, or add custom "http" level if desired
    logger.info(message.trim());
  }
};

module.exports = morganStream;