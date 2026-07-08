const cron = require('node-cron');
const { collectData } = require('./collect');
const { cleanupData } = require('./cleanup');

console.log('[Scheduler] Starting automated cron services...');
console.log('[Scheduler] Current Local System Time:', new Date().toString());

// 1. Collect data 3 times a day: 08:00, 12:00, and 15:00 WIB (Asia/Jakarta)
const collectDailyJob = cron.schedule('0 8,12,15 * * *', () => {
  console.log('[Scheduler] Triggering daily scheduled collection (08:00, 12:00, or 15:00 WIB)...');
  collectData();
}, {
  scheduled: true,
  timezone: 'Asia/Jakarta'
});

// 2. Collect data every 3 hours (as per ".csv file akan collect setiap 3 jam" instruction)
const collectThreeHourlyJob = cron.schedule('0 */3 * * *', () => {
  console.log('[Scheduler] Triggering 3-hourly collection...');
  collectData();
}, {
  scheduled: true,
  timezone: 'Asia/Jakarta'
});

// 3. Clean up files older than 30 days every day at midnight (00:00 WIB)
const cleansingJob = cron.schedule('0 0 * * *', () => {
  console.log('[Scheduler] Triggering daily data cleansing...');
  cleanupData();
}, {
  scheduled: true,
  timezone: 'Asia/Jakarta'
});

console.log('[Scheduler] Jobs successfully scheduled:');
console.log(' - Data collection: 08:00, 12:00, 15:00 WIB daily');
console.log(' - Data collection: Every 3 hours');
console.log(' - Data cleansing: Every day at 00:00 WIB (deletes files older than 30 days)');
