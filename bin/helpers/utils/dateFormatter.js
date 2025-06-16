const { utcToZonedTime } = require('date-fns-tz');

module.exports.getCurrentMonth = () => {
  const timeZone = 'Asia/Jakarta'; // GMT+7
  const now = utcToZonedTime(new Date(), timeZone);
  const year = now.getFullYear();
  const monthNum = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${monthNum}`;
};