const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { collectData, getCronFilename, cronDir } = require('./collect');
const { cleanupData } = require('./cleanup');

console.log('=== RUNNING CRON AND CLEANSING AUTOMATED TESTS ===\n');
console.log('Target Cron Directory:', cronDir);

// Helper to wait
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function runTests() {
  try {
    // Make sure directory exists
    if (!fs.existsSync(cronDir)) {
      fs.mkdirSync(cronDir, { recursive: true });
    }

    // ----------------------------------------------------
    // TEST 1: Node.js Collection Script (collect.js)
    // ----------------------------------------------------
    console.log('--- TEST 1: Running collect.js ---');
    
    // Define expected file path
    const expectedFilename = getCronFilename();
    const expectedPath = path.join(cronDir, expectedFilename);

    // Clean up if it already exists
    if (fs.existsSync(expectedPath)) {
      fs.unlinkSync(expectedPath);
    }

    // Trigger collection
    collectData();
    
    // Wait a brief moment for asynchronous HTTP calls or filesystem writes to finish
    await sleep(2500);

    if (fs.existsSync(expectedPath)) {
      console.log(`[PASS] Node collection file created successfully: ${expectedFilename}`);
      const stats = fs.statSync(expectedPath);
      console.log(`       File size: ${stats.size} bytes`);
    } else {
      throw new Error(`[FAIL] Node collection file was not created: ${expectedFilename}`);
    }

    // ----------------------------------------------------
    // TEST 2: Node.js Cleansing Script (cleanup.js)
    // ----------------------------------------------------
    console.log('\n--- TEST 2: Running cleanup.js ---');
    
    // Create mock files:
    // 1. One mock file that is valid (created today)
    // 2. One mock file that is expired (35 days ago, e.g. May 1st, 2026 -> cron_05012026_12.00.csv)
    const validMockPath = path.join(cronDir, 'cron_07072026_12.00.csv');
    const expiredMockPath = path.join(cronDir, 'cron_05012026_12.00.csv');

    fs.writeFileSync(validMockPath, 'id,name,email,message,createdAt\n1,valid,valid@example.com,test,2026-07-07T12:00:00.000Z\n', 'utf8');
    fs.writeFileSync(expiredMockPath, 'id,name,email,message,createdAt\n2,expired,expired@example.com,test,2026-05-01T12:00:00.000Z\n', 'utf8');

    console.log('Created mock files:');
    console.log(' - Valid (today): cron_07072026_12.00.csv');
    console.log(' - Expired (35 days ago): cron_05012026_12.00.csv');

    // Run cleanup
    cleanupData();

    // Verify
    const validExists = fs.existsSync(validMockPath);
    const expiredExists = fs.existsSync(expiredMockPath);

    if (validExists && !expiredExists) {
      console.log('[PASS] Node cleansing successfully deleted the expired file and kept the valid one.');
    } else {
      throw new Error(`[FAIL] Cleansing failed. Valid exists: ${validExists}, Expired exists: ${expiredExists}`);
    }

    // Clean up valid mock
    if (fs.existsSync(validMockPath)) fs.unlinkSync(validMockPath);

    // ----------------------------------------------------
    // TEST 3: PowerShell Collection Script (collect.ps1)
    // ----------------------------------------------------
    if (process.platform === 'win32') {
      console.log('\n--- TEST 3: Running collect.ps1 (PowerShell) ---');
      
      // Clean up expected file from previous test
      if (fs.existsSync(expectedPath)) {
        fs.unlinkSync(expectedPath);
      }

      console.log('Executing PowerShell collection script...');
      execSync(`powershell.exe -ExecutionPolicy Bypass -File "${path.join(__dirname, 'collect.ps1')}"`, { stdio: 'inherit' });
      
      if (fs.existsSync(expectedPath)) {
        console.log(`[PASS] PowerShell collection file created successfully: ${expectedFilename}`);
      } else {
        throw new Error(`[FAIL] PowerShell collection file was not created: ${expectedFilename}`);
      }

      // ----------------------------------------------------
      // TEST 4: PowerShell Cleansing Script (cleanup.ps1)
      // ----------------------------------------------------
      console.log('\n--- TEST 4: Running cleanup.ps1 (PowerShell) ---');
      
      // Re-create expired mock file
      fs.writeFileSync(expiredMockPath, 'id,name,email,message,createdAt\n2,expired,expired@example.com,test,2026-05-01T12:00:00.000Z\n', 'utf8');
      
      console.log('Executing PowerShell cleansing script...');
      execSync(`powershell.exe -ExecutionPolicy Bypass -File "${path.join(__dirname, 'cleanup.ps1')}"`, { stdio: 'inherit' });

      const expiredExistsPS = fs.existsSync(expiredMockPath);
      if (!expiredExistsPS) {
        console.log('[PASS] PowerShell cleansing successfully deleted the expired file.');
      } else {
        throw new Error(`[FAIL] PowerShell cleansing failed. Expired file still exists.`);
      }
    } else {
      console.log('\n[INFO] Skipping PowerShell tests (Not on Windows platform).');
    }

    console.log('\n==================================================');
    console.log('===        ALL INTEGRATION TESTS PASSED        ===');
    console.log('==================================================\n');
    process.exit(0);

  } catch (error) {
    console.error('\n!!! TEST FAILED !!!');
    console.error(error.message);
    process.exit(1);
  }
}

runTests();
