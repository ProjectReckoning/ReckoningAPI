const { createLogger, transports, format } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const fs = require('fs');
const path = require('path');

// Ensure the logs directory exists
const logDir = path.join(__dirname, '../../../logs'); // Adjust based on your file's depth
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logger = createLogger({
  level: 'info',
  transports: [
    new transports.Console(),
    // new transports.File({ filename: 'app.log' }) // optional
    new DailyRotateFile({
      filename: path.join(logDir, 'reckoningAPI-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: false,
      maxSize: '20m',
      maxFiles: '14d'
    })
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
