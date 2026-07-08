const fs = require('fs');
const path = require('path');
const { cronDir } = require('./collect');

function cleanupData() {
  console.log(`[Cleansing] Initiating cleanup process in ${cronDir}...`);
  
  if (!fs.existsSync(cronDir)) {
    console.log('[Cleansing] Directory does not exist. Nothing to clean.');
    return;
  }

  const now = new Date();
  const LIMIT_MS = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
  let deletedCount = 0;

  try {
    const files = fs.readdirSync(cronDir);

    for (const file of files) {
      const filePath = path.join(cronDir, file);
      
      try {
        const stats = fs.statSync(filePath);
        if (!stats.isFile()) continue;

        // Try parsing date from filename (format: cron_MMDDYYYY_HH.mm.csv)
        const match = file.match(/^cron_(\d{2})(\d{2})(\d{4})_(\d{2})\.(\d{2})(?:\.csv)?$/);
        let fileDate;

        if (match) {
          const month = parseInt(match[1], 10);
          const day = parseInt(match[2], 10);
          const year = parseInt(match[3], 10);
          const hour = parseInt(match[4], 10);
          const minute = parseInt(match[5], 10);
          fileDate = new Date(year, month - 1, day, hour, minute);
        } else {
          // Fallback to file modification time
          fileDate = stats.mtime;
        }

        const ageMs = now.getTime() - fileDate.getTime();

        if (ageMs > LIMIT_MS) {
          fs.unlinkSync(filePath);
          console.log(`[Cleansing] Deleted expired file: ${file} (Age: ${(ageMs / (24 * 60 * 60 * 1000)).toFixed(1)} days)`);
          deletedCount++;
        }
      } catch (err) {
        console.error(`[Cleansing] Error processing file ${file}:`, err.message);
      }
    }

    console.log(`[Cleansing] Cleanup process finished. Deleted ${deletedCount} file(s).`);
  } catch (err) {
    console.error('[Cleansing] Error reading directory:', err.message);
  }
}

// Execute cleanup if script is run directly
if (require.main === module) {
  cleanupData();
}

module.exports = { cleanupData };
