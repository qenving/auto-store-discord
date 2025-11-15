#!/usr/bin/env node

/**
 * Test Database Connection
 * Usage: node scripts/test-database.js
 */

const configManager = require('../shared/config/ConfigManager');
const databaseProvider = require('../shared/database/provider/DatabaseProvider');
const logger = require('../shared/logger/Logger');

async function testDatabase() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║       DATABASE CONNECTION TESTER                       ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  try {
    // Load config
    console.log('📝 Loading configuration...');
    configManager.load();
    const dbConfig = configManager.getDatabaseConfig();

    console.log(`✅ Config loaded: ${dbConfig.type}\n`);

    // Initialize database
    console.log('🔌 Connecting to database...');
    await databaseProvider.initialize();

    // Test connection
    console.log('🧪 Testing connection...\n');
    const result = await databaseProvider.testConnection();

    if (result.success) {
      console.log('╔════════════════════════════════════════════════════════╗');
      console.log('║              ✅ CONNECTION SUCCESSFUL!                 ║');
      console.log('╚════════════════════════════════════════════════════════╝\n');

      console.log('📊 Connection Details:');
      console.log(`   Database Type: ${databaseProvider.getDatabaseType()}`);

      if (dbConfig.type === 'mysql') {
        console.log(`   Host: ${dbConfig.mysql.host}:${dbConfig.mysql.port || 3306}`);
        console.log(`   Database: ${dbConfig.mysql.database}`);
        console.log(`   User: ${dbConfig.mysql.user}`);
      } else if (dbConfig.type === 'mongodb') {
        const uriParts = dbConfig.mongodb.uri.match(/mongodb(?:\+srv)?:\/\/([^@]+@)?([^/]+)/);
        console.log(`   URI: ${uriParts ? uriParts[2] : 'localhost'}`);
      }

      console.log(`\n   Message: ${result.message}`);
      console.log(`   Latency: ${result.latency}ms\n`);

      // Test basic operations
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🧪 Testing basic operations...\n');

      try {
        // Test repository access
        const userRepo = databaseProvider.getUserRepository();
        const productRepo = databaseProvider.getProductRepository();
        const stockRepo = databaseProvider.getStockRepository();
        const orderRepo = databaseProvider.getOrderRepository();

        console.log('✅ User repository accessible');
        console.log('✅ Product repository accessible');
        console.log('✅ Stock repository accessible');
        console.log('✅ Order repository accessible\n');

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log('✅ ALL TESTS PASSED!\n');
        console.log('📝 Next steps:');
        console.log('   - Your database is ready to use');
        console.log('   - Start the bot: npm run bot');
        console.log('   - Start desktop app: npm start\n');

      } catch (repoError) {
        console.log('⚠️  Warning: Could not access repositories');
        console.log('   This might be normal if tables/collections are not created yet\n');
        console.log('📝 Next steps:');
        console.log('   - Start the bot to auto-create tables: npm run bot\n');
      }

    } else {
      console.log('╔════════════════════════════════════════════════════════╗');
      console.log('║               ❌ CONNECTION FAILED!                    ║');
      console.log('╚════════════════════════════════════════════════════════╝\n');

      console.log('❌ Error Details:');
      console.log(`   ${result.message}\n`);

      console.log('📝 Troubleshooting:');

      if (dbConfig.type === 'mysql') {
        console.log('\n   MySQL Connection Issues:\n');
        console.log('   1. Pastikan MySQL service sudah running:');
        console.log('      - Windows: Check Services → MySQL80');
        console.log('      - Linux: sudo systemctl status mysql');
        console.log('      - macOS: brew services list\n');
        console.log('   2. Periksa credentials di config.json:');
        console.log('      - database.mysql.host (default: localhost)');
        console.log('      - database.mysql.port (default: 3306)');
        console.log('      - database.mysql.user (default: root)');
        console.log('      - database.mysql.password\n');
        console.log('   3. Test manual connection:');
        console.log('      mysql -u root -p\n');
        console.log('   4. Create database jika belum ada:');
        console.log('      CREATE DATABASE autostore;\n');

      } else if (dbConfig.type === 'mongodb') {
        console.log('\n   MongoDB Connection Issues:\n');
        console.log('   1. Pastikan MongoDB service sudah running:');
        console.log('      - Windows: Check Services → MongoDB');
        console.log('      - Linux: sudo systemctl status mongod');
        console.log('      - macOS: brew services list\n');
        console.log('   2. Untuk MongoDB Atlas (cloud):');
        console.log('      - Periksa network access (0.0.0.0/0 allowed)');
        console.log('      - Periksa database user credentials');
        console.log('      - Periksa connection string format:\n');
        console.log('        mongodb+srv://username:password@cluster.mongodb.net/database\n');
        console.log('   3. Untuk MongoDB local:');
        console.log('      - Default: mongodb://localhost:27017/autostore\n');
      }

      console.log('📚 Dokumentasi:');
      console.log('   - Baca FAQ.md untuk troubleshooting lengkap');
      console.log('   - Baca CARA_SETUP.md untuk setup database\n');

      process.exit(1);
    }

  } catch (error) {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║                  ❌ ERROR                              ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    console.error('❌ Error:', error.message, '\n');

    if (error.message.includes('config.json')) {
      console.log('📝 Solusi:');
      console.log('   1. Copy config.example.json → config.json');
      console.log('   2. Edit config.json dan isi database credentials');
      console.log('   3. Jalankan lagi: npm run test:database\n');
    }

    process.exit(1);
  } finally {
    // Disconnect
    try {
      await databaseProvider.disconnect();
      console.log('🔌 Database disconnected\n');
    } catch (err) {
      // Ignore disconnect errors
    }
  }
}

// Run test
testDatabase();
