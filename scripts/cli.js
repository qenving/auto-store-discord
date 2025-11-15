#!/usr/bin/env node

/**
 * Auto-Store CLI - Interactive Command Line Interface
 * Usage: npm run cli [command]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get command from args
const command = process.argv[2];

// Banner
function showBanner() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║        AUTO-STORE ECOSYSTEM - CLI TOOLS                ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
}

// Help menu
function showHelp() {
  showBanner();
  console.log('📚 Available Commands:\n');
  console.log('   npm run cli                    - Show this help menu');
  console.log('   npm run cli test-config        - Validate config.json');
  console.log('   npm run cli test-database      - Test database connection');
  console.log('   npm run cli health             - Check all services health');
  console.log('   npm run cli init               - Initialize new project');
  console.log('\n📖 Documentation:');
  console.log('   - README.md         : Quick start & overview');
  console.log('   - KONFIGURASI.md    : Config field explanations');
  console.log('   - CARA_SETUP.md     : Step-by-step setup guide');
  console.log('   - FAQ.md            : Troubleshooting & common errors\n');
}

// Test config
function testConfig() {
  showBanner();
  console.log('🔍 Running config validation...\n');
  try {
    execSync('node scripts/test-config.js', { stdio: 'inherit' });
  } catch (error) {
    process.exit(1);
  }
}

// Test database
function testDatabase() {
  showBanner();
  console.log('🔍 Running database connection test...\n');
  try {
    execSync('node scripts/test-database.js', { stdio: 'inherit' });
  } catch (error) {
    process.exit(1);
  }
}

// Health check
function healthCheck() {
  showBanner();
  console.log('🏥 Running health checks...\n');

  let allHealthy = true;

  // Check 1: Config file exists
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝 Checking config.json...\n');

  const configPath = path.join(process.cwd(), 'config.json');
  if (fs.existsSync(configPath)) {
    console.log('✅ config.json exists\n');
  } else {
    console.log('❌ config.json not found\n');
    console.log('   Run: cp config.example.json config.json\n');
    allHealthy = false;
  }

  // Check 2: Node modules
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📦 Checking node_modules...\n');

  const nodeModulesPath = path.join(process.cwd(), 'node_modules');
  if (fs.existsSync(nodeModulesPath)) {
    console.log('✅ Dependencies installed\n');
  } else {
    console.log('❌ node_modules not found\n');
    console.log('   Run: npm install\n');
    allHealthy = false;
  }

  // Check 3: Required folders
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📁 Checking project structure...\n');

  const requiredFolders = ['bot', 'shared', 'gui'];
  requiredFolders.forEach(folder => {
    const folderPath = path.join(process.cwd(), folder);
    if (fs.existsSync(folderPath)) {
      console.log(`✅ /${folder} exists`);
    } else {
      console.log(`❌ /${folder} not found`);
      allHealthy = false;
    }
  });

  // Check 4: Node version
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔧 Checking Node.js version...\n');

  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

  if (majorVersion >= 18) {
    console.log(`✅ Node.js ${nodeVersion} (>= 18.x required)\n`);
  } else {
    console.log(`❌ Node.js ${nodeVersion} (>= 18.x required)\n`);
    console.log('   Update Node.js: https://nodejs.org/\n');
    allHealthy = false;
  }

  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (allHealthy) {
    console.log('✅ ALL HEALTH CHECKS PASSED!\n');
    console.log('📝 Next steps:');
    console.log('   - npm run cli test-config     : Validate configuration');
    console.log('   - npm run cli test-database   : Test database connection');
    console.log('   - npm run bot                 : Start Discord bot');
    console.log('   - npm start                   : Start desktop app\n');
  } else {
    console.log('❌ SOME HEALTH CHECKS FAILED!\n');
    console.log('   Fix the issues above before proceeding.\n');
  }
}

// Initialize new project
function initProject() {
  showBanner();
  console.log('🚀 Initializing new Auto-Store project...\n');

  // Check if config.json already exists
  const configPath = path.join(process.cwd(), 'config.json');
  if (fs.existsSync(configPath)) {
    console.log('⚠️  Warning: config.json already exists!');
    console.log('   Skipping config creation to prevent overwriting.\n');
  } else {
    console.log('📝 Creating config.json from template...');
    const examplePath = path.join(process.cwd(), 'config.example.json');
    if (fs.existsSync(examplePath)) {
      fs.copyFileSync(examplePath, configPath);
      console.log('✅ config.json created\n');
    } else {
      console.log('❌ config.example.json not found!\n');
      return;
    }
  }

  // Instructions
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📚 NEXT STEPS:\n');

  console.log('1️⃣  Install dependencies:');
  console.log('   npm install\n');

  console.log('2️⃣  Edit config.json:');
  console.log('   - Set mode (DiscordBotOnly recommended)');
  console.log('   - Fill Discord bot token & credentials');
  console.log('   - Configure database (MySQL or MongoDB)');
  console.log('   - Configure payment provider (optional)\n');
  console.log('   📖 Read KONFIGURASI.md for field explanations\n');

  console.log('3️⃣  Validate configuration:');
  console.log('   npm run cli test-config\n');

  console.log('4️⃣  Test database connection:');
  console.log('   npm run cli test-database\n');

  console.log('5️⃣  Start the bot:');
  console.log('   npm run bot\n');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('📖 Documentation:');
  console.log('   - CARA_SETUP.md : Detailed setup guide');
  console.log('   - README.md     : Quick start & overview');
  console.log('   - FAQ.md        : Troubleshooting\n');
}

// Route commands
switch (command) {
  case 'test-config':
    testConfig();
    break;

  case 'test-database':
    testDatabase();
    break;

  case 'health':
    healthCheck();
    break;

  case 'init':
    initProject();
    break;

  case 'help':
  case undefined:
    showHelp();
    break;

  default:
    console.error(`❌ Unknown command: ${command}\n`);
    showHelp();
    process.exit(1);
}
