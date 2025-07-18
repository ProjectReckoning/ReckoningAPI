const { toZonedTime, fromZonedTime } = require('date-fns-tz');
const {
  addDays,
  addMonths,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds
} = require('date-fns');

const TIMEZONE = 'Asia/Jakarta'; // WIB (GMT+7)

module.exports.getCurrentMonth = () => {
  const now = toZonedTime(new Date(), TIMEZONE);
  const year = now.getFullYear();
  const monthNum = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${monthNum}`;
};

module.exports.getCurrentWIBDate = () => {
  return toZonedTime(new Date(), TIMEZONE);
};

module.exports.toUTCFromWIB = (date) => {
  return fromZonedTime(date, TIMEZONE);
};

module.exports.calculateNextRunDate = (scheduleType, scheduleValue) => {
  const now = toZonedTime(new Date(), TIMEZONE);
  let next;

  if (scheduleType === 'weekly') {
    const today = now.getDay(); // 0 (Sun) - 6 (Sat)
    const targetDay = scheduleValue % 7; // normalize
    let daysUntilNext = targetDay - today;
    if (daysUntilNext <= 0) daysUntilNext += 7;
    next = addDays(now, daysUntilNext);
  } else if (scheduleType === 'monthly') {
    const targetDay = Math.min(scheduleValue, 28); // avoid invalid date
    next = addMonths(now, 1);
    next.setDate(targetDay);
  } else {
    return null;
  }

  // Set to 3:00 AM WIB
  next = setHours(next, 3);
  next = setMinutes(next, 0);
  next = setSeconds(next, 0);
  next = setMilliseconds(next, 0);

  // Convert WIB time to UTC to store in DB
  return fromZonedTime(next, TIMEZONE);
};

module.exports.calculateNextRunDateFromSchedule = (scheduleData) => {
  const { date, month_start, year_start } = scheduleData;

  // Force valid date up to 28
  const safeDate = Math.min(date, 28);

  let runDate = new Date(year_start, month_start, safeDate);

  runDate = setHours(runDate, 3);
  runDate = setMinutes(runDate, 0);
  runDate = setSeconds(runDate, 0);
  runDate = setMilliseconds(runDate, 0);

  return fromZonedTime(runDate, TIMEZONE);
};