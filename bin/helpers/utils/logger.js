const { createLogger, transports, format } = require('winston');

const logger = createLogger({
  level: 'info',
  transports: [
    new transports.Console(),
    // new transports.File({ filename: 'app.log' }) // optional
  ],
  format: format.combine(
    format.timestamp(),
    format.printf(({ timestamp, level, message }) => {
      const msg = typeof message === 'string' ? message : JSON.stringify(message);
      const isHttpLog = msg.match(/^(GET|POST|PUT|DELETE|PATCH|OPTIONS)\s/);

      return isHttpLog
        ? `[${timestamp}] ${msg}`                      // No level for Morgan logs
        : `[${timestamp}] ${level.toUpperCase()}: ${msg}`; // Default
    })
  ),
});

module.exports = logger;
