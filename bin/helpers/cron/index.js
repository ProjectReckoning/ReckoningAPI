const cron = require('node-cron');
const { runAutoBudgetJob } = require('../../modules/transaction/autoBudgetModules');
const logger = require('../utils/logger');

const startAllCrons = () => {
  // Run every day at 3:00 AM
  logger.info('[Cron] Will be running cron job at 3:00 AM...');
  cron.schedule('0 3 * * *', async () => {
    logger.info('[Cron] Running auto-budget job at 3:00 AM...');
    await runAutoBudgetJob();
  }, {
    timezone: 'Asia/Jakarta'
  });
}

module.exports = startAllCrons;