const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, 'data-test.csv');
if (fs.existsSync(csvPath)) {
  console.log('Cleaning up existing data-test.csv for test isolation...');
  try {
    fs.unlinkSync(csvPath);
  } catch (err) {
    console.error('Could not delete data-test.csv:', err);
  }
}

const TEST_PORT = 5001;

// Start the server on the test port
console.log(`Starting Express server for testing on port ${TEST_PORT}...`);
const server = spawn('node', [path.join(__dirname, 'server.js')], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, PORT: TEST_PORT, CSV_FILE: csvPath }
});

// Wait a bit for the server to start, then run the tests
setTimeout(() => {
  runTests();
}, 2500);

function post(path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const req = http.request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function postRaw(path, rawString) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(rawString)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    req.write(rawString);
    req.end();
  });
}

function get(path) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: path,
      method: 'GET'
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  try {
    console.log('\n--- Running API Integration Tests ---\n');

    // Test 1: GET root API details
    console.log('Testing GET / (Root Welcome Endpoint)...');
    const rootRes = await get('/');
    console.log('Status:', rootRes.statusCode);
    console.log('Body:', JSON.stringify(rootRes.body, null, 2));

    // Test 2: GET /api/submissions (should be empty initially)
    console.log('\nTesting GET /api/submissions (Initial)...');
    const initGetRes = await get('/api/submissions');
    console.log('Status:', initGetRes.statusCode);
    console.log('Submissions Count:', initGetRes.body.count);

    // Test 3: POST /api/submit (Valid data)
    console.log('\nTesting POST /api/submit (Valid submission)...');
    const validPostRes = await post('/api/submit', {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      message: 'Hello, this is a test message.'
    });
    console.log('Status:', validPostRes.statusCode);
    console.log('Success:', validPostRes.body.success);
    console.log('Stored Data:', JSON.stringify(validPostRes.body.data, null, 2));

    // Test 4: POST /api/submit (Invalid data - missing message)
    console.log('\nTesting POST /api/submit (Invalid submission - missing message)...');
    const invalidPostRes = await post('/api/submit', {
      name: 'Bob',
      email: 'bob@example.com'
    });
    console.log('Status:', invalidPostRes.statusCode);
    console.log('Success:', invalidPostRes.body.success);
    console.log('Error Message:', invalidPostRes.body.message);

    // Test 4a: POST /api/submit (Empty body)
    console.log('\nTesting POST /api/submit (Empty body)...');
    const emptyPostRes = await postRaw('/api/submit', '');
    console.log('Status:', emptyPostRes.statusCode);
    console.log('Success:', emptyPostRes.body.success);
    console.log('Error Message:', emptyPostRes.body.message);

    // Test 4b: POST /api/submit (Invalid JSON syntax)
    console.log('\nTesting POST /api/submit (Invalid JSON syntax)...');
    const invalidJsonRes = await postRaw('/api/submit', '{ invalid-json }');
    console.log('Status:', invalidJsonRes.statusCode);
    console.log('Success:', invalidJsonRes.body.success);
    console.log('Error Message:', invalidJsonRes.body.message);

    // Test 4c: POST /api/submit (Batch submission - array of objects)
    console.log('\nTesting POST /api/submit (Batch submission)...');
    const batchPostRes = await post('/api/submit', [
      {
        name: 'alif wahyulloh',
        email: 'alifw2@gmail.com',
        message: 'new account'
      },
      {
        name: 'alif wahyulloh2',
        email: 'alifw2@gmail.com',
        message: 'new account'
      },
      {
        name: 'alif wahyulloh23',
        email: 'walifw2@gmail.com',
        message: 'new account'
      },
      {
        name: 'alifsss wahyulloh23',
        email: 'walifwdd2@gmail.com',
        message: 'new account'
      }
    ]);
    console.log('Status:', batchPostRes.statusCode);
    console.log('Success:', batchPostRes.body.success);
    console.log('Batch Message:', batchPostRes.body.message);
    console.log('Number of items created:', batchPostRes.body.data.length);

    // Test 5: GET /api/submissions (should contain 5 items now)
    console.log('\nTesting GET /api/submissions (After post)...');
    const postGetRes = await get('/api/submissions');
    console.log('Status:', postGetRes.statusCode);
    console.log('Submissions Count:', postGetRes.body.count);
    console.log('Submissions Data:', JSON.stringify(postGetRes.body.data, null, 2));

    if (postGetRes.body.count === 5 && postGetRes.body.data[4].name === 'alifsss wahyulloh23') {
      console.log('\n=== ALL TESTS PASSED SUCCESSFULLY ===\n');
      process.exitCode = 0;
    } else {
      console.error('\n=== SOME TESTS FAILED ===\n');
      process.exitCode = 1;
    }
  } catch (error) {
    console.error('Test execution error:', error);
    process.exitCode = 1;
  } finally {
    console.log('Stopping Express server...');
    server.kill();
    // Force exit after a tiny delay to ensure stdout is flushed
    setTimeout(() => {
      process.exit(process.exitCode);
    }, 100);
  }
}
