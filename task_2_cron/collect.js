const http = require('http');
const fs = require('fs');
const path = require('path');

// Target directory configuration
let cronDir = process.platform === 'win32' ? 'C:\\home\\cron' : '/home/cron';

// Ensure the directory exists
try {
  if (!fs.existsSync(cronDir)) {
    fs.mkdirSync(cronDir, { recursive: true });
  }
} catch (err) {
  console.warn(`Warning: Failed to create/access absolute path ${cronDir} due to permissions. Using fallback local directory.`);
  cronDir = path.join(__dirname, 'home', 'cron');
  if (!fs.existsSync(cronDir)) {
    fs.mkdirSync(cronDir, { recursive: true });
  }
}

// Generate the filename matching format: cron_MMDDYYYY_HH.00.csv
function getCronFilename() {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const yyyy = now.getFullYear();
  const hh = String(now.getHours()).padStart(2, '0');
  return `cron_${mm}${dd}${yyyy}_${hh}.00.csv`;
}

function escapeCSV(val) {
  if (val === undefined || val === null) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function jsonToCSV(submissions) {
  const header = 'id,name,email,message,createdAt\n';
  const rows = submissions.map(sub => [
    escapeCSV(sub.id),
    escapeCSV(sub.name),
    escapeCSV(sub.email),
    escapeCSV(sub.message),
    escapeCSV(sub.createdAt)
  ].join(',')).join('\n');
  return header + rows + '\n';
}

function collectData() {
  const filename = getCronFilename();
  const targetPath = path.join(cronDir, filename);

  console.log(`[Collection] Initiating data collection to ${targetPath}...`);

  // Try calling the HTTP API
  const req = http.request({
    hostname: 'localhost',
    port: process.env.PORT || 5000,
    path: '/api/submissions',
    method: 'GET',
    timeout: 3000
  }, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      if (res.statusCode === 200) {
        try {
          const json = JSON.parse(body);
          if (json.success && Array.isArray(json.data)) {
            const csvData = jsonToCSV(json.data);
            fs.writeFileSync(targetPath, csvData, 'utf8');
            console.log(`[Collection] Successfully collected ${json.data.length} records via HTTP API.`);
            return;
          }
        } catch (e) {
          console.error('[Collection] Failed to parse API JSON response. Falling back to local CSV copy.');
        }
      }
      fallbackToLocalFile(targetPath);
    });
  });

  req.on('error', (err) => {
    console.warn(`[Collection] API Server offline or unreachable (${err.message}). Falling back to local CSV copy.`);
    fallbackToLocalFile(targetPath);
  });

  req.on('timeout', () => {
    req.destroy();
    console.warn('[Collection] API Server timeout. Falling back to local CSV copy.');
    fallbackToLocalFile(targetPath);
  });

  req.end();
}

function fallbackToLocalFile(targetPath) {
  const localCsvPath = path.join(__dirname, '..', 'data.csv');
  if (fs.existsSync(localCsvPath)) {
    try {
      const data = fs.readFileSync(localCsvPath, 'utf8');
      fs.writeFileSync(targetPath, data, 'utf8');
      console.log(`[Collection] Successfully copied data from local database file ${localCsvPath}.`);
    } catch (err) {
      console.error('[Collection] Failed to copy local CSV file:', err);
    }
  } else {
    try {
      fs.writeFileSync(targetPath, 'id,name,email,message,createdAt\n', 'utf8');
      console.log(`[Collection] No source database found. Initialized empty CSV at ${targetPath}.`);
    } catch (err) {
      console.error('[Collection] Failed to create empty CSV file:', err);
    }
  }
}

// Execute collection when script is run directly
if (require.main === module) {
  collectData();
}

module.exports = { collectData, getCronFilename, cronDir };
