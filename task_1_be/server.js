const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS so the frontend can interact with this API
app.use(cors());

// Parse incoming JSON requests
app.use(express.json());

const fs = require('fs');
const path = require('path');

const CSV_FILE = process.env.CSV_FILE || path.join(__dirname, 'data.csv');

// Helper to initialize CSV file if it doesn't exist or is empty
function initCSV() {
  if (!fs.existsSync(CSV_FILE) || fs.statSync(CSV_FILE).size === 0) {
    const header = 'id,name,email,message,createdAt\n';
    fs.writeFileSync(CSV_FILE, header, 'utf8');
  }
}

// Helper to escape values for CSV
function escapeCSV(val) {
  if (val === undefined || val === null) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// RFC 4180 compliant character-by-character CSV parser
function parseCSV(csvText) {
  const lines = [];
  let row = [''];
  lines.push(row);
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const c = csvText[i];
    const next = csvText[i + 1];

    if (inQuotes) {
      if (c === '"') {
        if (next === '"') {
          row[row.length - 1] += '"';
          i++; // Skip next quote
        } else {
          inQuotes = false;
        }
      } else {
        row[row.length - 1] += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ',') {
        row.push('');
      } else if (c === '\n' || c === '\r') {
        if (c === '\r' && next === '\n') {
          i++;
        }
        if (i < csvText.length - 1) {
          row = [''];
          lines.push(row);
        }
      } else {
        row[row.length - 1] += c;
      }
    }
  }
  return lines;
}

// Helper to calculate the next ID from existing CSV entries
function getNextId() {
  initCSV();
  const data = fs.readFileSync(CSV_FILE, 'utf8');
  const rows = parseCSV(data);
  let maxId = 0;
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length > 0 && row[0]) {
      const id = parseInt(row[0], 10);
      if (!isNaN(id) && id > maxId) {
        maxId = id;
      }
    }
  }
  return maxId + 1;
}

/**
 * Root Route
 * Provides simple API information and welcome message.
 */
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Assessment Backend API',
    endpoints: {
      submit: {
        method: 'POST',
        url: '/api/submit',
        description: 'Submit form data',
        expectedFields: ['name', 'email', 'message']
      },
      submissions: {
        method: 'GET',
        url: '/api/submissions',
        description: 'Retrieve all saved submissions'
      }
    }
  });
});

/**
 * POST /api/submit
 * Receives form data from the frontend and stores it in-memory.
 */
app.post('/api/submit', (req, res) => {
  // Check if req.body is missing or empty
  if (!req.body || (Array.isArray(req.body) && req.body.length === 0) || (!Array.isArray(req.body) && Object.keys(req.body).length === 0)) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Request body is empty or missing.'
    });
  }

  // Normalize inputs to an array
  const items = Array.isArray(req.body) ? req.body : [req.body];

  // Validate all items in the array
  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
    const { name, email, message } = item || {};
    const itemPrefix = Array.isArray(req.body) ? `Item at index ${idx}: ` : '';

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: `${itemPrefix}Name is required and must be a valid string.`
      });
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: `${itemPrefix}A valid email is required.`
      });
    }

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: `${itemPrefix}Message is required and must be a valid string.`
      });
    }
  }

  // Assign IDs and write to CSV
  let currentId = getNextId();
  const newSubmissions = [];
  let csvLines = '';

  for (const item of items) {
    const newSubmission = {
      id: currentId++,
      name: item.name.trim(),
      email: item.email.trim(),
      message: item.message.trim(),
      createdAt: new Date().toISOString()
    };

    newSubmissions.push(newSubmission);

    csvLines += [
      escapeCSV(newSubmission.id),
      escapeCSV(newSubmission.name),
      escapeCSV(newSubmission.email),
      escapeCSV(newSubmission.message),
      escapeCSV(newSubmission.createdAt)
    ].join(',') + '\n';
  }

  try {
    fs.appendFileSync(CSV_FILE, csvLines, 'utf8');

    res.status(201).json({
      success: true,
      message: Array.isArray(req.body)
        ? `${items.length} submissions successfully received and stored!`
        : 'Submission successfully received and stored!',
      data: Array.isArray(req.body) ? newSubmissions : newSubmissions[0]
    });
  } catch (err) {
    console.error('Failed to write to CSV:', err);
    res.status(500).json({
      success: false,
      error: 'File Error',
      message: 'Failed to save submission.'
    });
  }
});

/**
 * GET /api/submissions
 * Returns all saved submissions.
 */
app.get('/api/submissions', (req, res) => {
  try {
    initCSV();
    const data = fs.readFileSync(CSV_FILE, 'utf8');
    const rows = parseCSV(data);

    // The first row is the header
    const submissions = [];

    // Parse data rows
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      // Skip empty or incomplete rows
      if (row.length < 5 || row.every(cell => cell === '')) continue;

      submissions.push({
        id: parseInt(row[0], 10),
        name: row[1],
        email: row[2],
        message: row[3],
        createdAt: row[4]
      });
    }

    res.json({
      success: true,
      count: submissions.length,
      data: submissions
    });
  } catch (err) {
    console.error('Failed to read CSV:', err);
    res.status(500).json({
      success: false,
      error: 'File Error',
      message: 'Failed to retrieve submissions.'
    });
  }
});

/**
 * 404 Route handler for unmatched routes
 */
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.url}`
  });
});

/**
 * Global Error Handler
 */
app.use((err, req, res, next) => {
  // Handle invalid JSON syntax errors from body-parser
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: 'Invalid JSON payload.'
    });
  }

  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred.'
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
