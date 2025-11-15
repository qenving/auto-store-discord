#!/usr/bin/env node

/**
 * Test Config - Validate config.json
 * Usage: node scripts/test-config.js
 */

const fs = require('fs');
const path = require('path');

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║         CONFIG VALIDATOR - Test config.json           ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

// Check if config.json exists
const configPath = path.join(process.cwd(), 'config.json');

if (!fs.existsSync(configPath)) {
  console.error('❌ ERROR: config.json tidak ditemukan!\n');
  console.log('📝 Solusi:');
  console.log('   1. Copy config.example.json → config.json');
  console.log('   2. Edit config.json sesuai kebutuhan\n');
  console.log('   Perintah: cp config.example.json config.json\n');
  process.exit(1);
}

console.log('✅ File config.json ditemukan\n');

// Load config
let config;
try {
  const configContent = fs.readFileSync(configPath, 'utf8');
  config = JSON.parse(configContent);
  console.log('✅ Format JSON valid\n');
} catch (error) {
  console.error('❌ ERROR: Format JSON tidak valid!\n');
  console.error('   Detail:', error.message, '\n');
  console.log('📝 Solusi:');
  console.log('   - Pastikan tidak ada koma terakhir');
  console.log('   - Pastikan semua string menggunakan "double quotes"');
  console.log('   - Cek syntax dengan JSON validator online\n');
  process.exit(1);
}

// Validation results
const errors = [];
const warnings = [];
const infos = [];

// Validate mode
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔍 VALIDATING MODE');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const validModes = ['DiscordBotOnly', 'WebOnly', 'IntegratedMode'];
if (!config.mode) {
  errors.push('mode belum diisi');
} else if (!validModes.includes(config.mode)) {
  errors.push(`mode tidak valid: "${config.mode}". Pilihan: ${validModes.join(', ')}`);
} else {
  console.log(`✅ Mode: ${config.mode}`);
}

const isBotEnabled = config.mode === 'DiscordBotOnly' || config.mode === 'IntegratedMode';
const isWebEnabled = config.mode === 'WebOnly' || config.mode === 'IntegratedMode';

// Validate Discord config (if bot enabled)
if (isBotEnabled) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🤖 VALIDATING DISCORD BOT CONFIG');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (!config.discord) {
    errors.push('discord section tidak ditemukan');
  } else {
    // Token
    if (!config.discord.token || config.discord.token.includes('PASTE_')) {
      errors.push('discord.token belum diisi!\n   Cara: Lihat CARA_SETUP.md bagian "Mendapatkan Bot Token"');
    } else {
      console.log('✅ Bot token configured');
    }

    // Client ID
    if (!config.discord.clientId || config.discord.clientId.includes('PASTE_')) {
      errors.push('discord.clientId belum diisi!\n   Cara: Lihat CARA_SETUP.md bagian "Mendapatkan Application ID"');
    } else {
      console.log('✅ Client ID configured');
    }

    // Guild ID
    if (!config.discord.guildId || config.discord.guildId.includes('PASTE_')) {
      errors.push('discord.guildId belum diisi!\n   Cara: Right-click server → Copy ID (Developer Mode harus aktif)');
    } else {
      console.log('✅ Guild ID configured');
    }

    // Owner ID
    if (!config.discord.ownerId || config.discord.ownerId.includes('PASTE_')) {
      warnings.push('discord.ownerId belum diisi - Beberapa admin command tidak akan bisa digunakan');
    } else {
      console.log('✅ Owner ID configured');
    }
  }
}

// Validate database config
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🗄️  VALIDATING DATABASE CONFIG');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (!config.database) {
  errors.push('database section tidak ditemukan');
} else {
  const validDbTypes = ['mysql', 'mongodb'];
  if (!config.database.type) {
    errors.push('database.type belum dipilih. Pilihan: "mysql" atau "mongodb"');
  } else if (!validDbTypes.includes(config.database.type)) {
    errors.push(`database.type tidak valid: "${config.database.type}". Pilihan: ${validDbTypes.join(', ')}`);
  } else {
    console.log(`✅ Database type: ${config.database.type}`);

    // Validate MySQL config
    if (config.database.type === 'mysql') {
      if (!config.database.mysql) {
        errors.push('database.mysql section tidak ditemukan');
      } else {
        if (!config.database.mysql.host) errors.push('database.mysql.host belum diisi');
        if (!config.database.mysql.user) errors.push('database.mysql.user belum diisi');
        if (!config.database.mysql.password || config.database.mysql.password.includes('ISI_PASSWORD')) {
          warnings.push('database.mysql.password belum diisi atau masih default');
        }
        if (!config.database.mysql.database) errors.push('database.mysql.database belum diisi');

        if (errors.length === 0) {
          console.log(`✅ MySQL config: ${config.database.mysql.user}@${config.database.mysql.host}:${config.database.mysql.port || 3306}`);
        }
      }
    }

    // Validate MongoDB config
    if (config.database.type === 'mongodb') {
      if (!config.database.mongodb) {
        errors.push('database.mongodb section tidak ditemukan');
      } else {
        if (!config.database.mongodb.uri) {
          errors.push('database.mongodb.uri belum diisi');
        } else if (config.database.mongodb.uri.includes('localhost:27017')) {
          infos.push('MongoDB menggunakan localhost - pastikan MongoDB service sudah running');
          console.log(`✅ MongoDB config: ${config.database.mongodb.uri}`);
        } else {
          console.log(`✅ MongoDB config: ${config.database.mongodb.uri.substring(0, 30)}...`);
        }
      }
    }
  }
}

// Validate payment config
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('💳 VALIDATING PAYMENT CONFIG');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (!config.payment) {
  warnings.push('payment section tidak ditemukan - Payment gateway tidak akan berfungsi');
} else {
  const validProviders = ['midtrans', 'duitku', 'tripay', 'manual'];
  if (!config.payment.provider) {
    warnings.push('payment.provider belum dipilih - Payment gateway tidak akan berfungsi');
  } else if (!validProviders.includes(config.payment.provider)) {
    warnings.push(`payment.provider tidak valid: "${config.payment.provider}". Pilihan: ${validProviders.join(', ')}`);
  } else {
    console.log(`✅ Payment provider: ${config.payment.provider}`);

    if (config.payment.provider !== 'manual') {
      const providerConfig = config.payment[config.payment.provider];
      if (!providerConfig) {
        warnings.push(`payment.${config.payment.provider} section tidak ditemukan`);
      } else {
        // Check for API keys
        const hasApiKey = providerConfig.serverKey || providerConfig.apiKey || providerConfig.merchantCode;
        if (!hasApiKey) {
          warnings.push(`payment.${config.payment.provider} API keys belum diisi - Payment tidak akan berfungsi`);
        } else {
          console.log(`✅ ${config.payment.provider} API keys configured`);
        }
      }
    }
  }
}

// Validate website config (if web enabled)
if (isWebEnabled) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🌐 VALIDATING WEBSITE CONFIG');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (!config.website) {
    warnings.push('website section tidak ditemukan');
  } else {
    if (!config.website.jwtSecret || config.website.jwtSecret.includes('GANTI_')) {
      warnings.push('website.jwtSecret belum diisi - Auth tidak aman!');
    } else {
      console.log('✅ JWT secret configured');
    }

    if (!config.website.adminSecretKey || config.website.adminSecretKey.includes('PASSWORD_')) {
      warnings.push('website.adminSecretKey belum diisi - Admin login tidak aman!');
    } else {
      console.log('✅ Admin secret configured');
    }
  }
}

// Print summary
console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║                  VALIDATION SUMMARY                    ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

if (errors.length > 0) {
  console.log(`❌ ERRORS (${errors.length}):\n`);
  errors.forEach((err, i) => {
    console.log(`   ${i + 1}. ${err}\n`);
  });
}

if (warnings.length > 0) {
  console.log(`⚠️  WARNINGS (${warnings.length}):\n`);
  warnings.forEach((warn, i) => {
    console.log(`   ${i + 1}. ${warn}\n`);
  });
}

if (infos.length > 0) {
  console.log(`ℹ️  INFO (${infos.length}):\n`);
  infos.forEach((info, i) => {
    console.log(`   ${i + 1}. ${info}\n`);
  });
}

if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ KONFIGURASI VALID! Siap untuk dijalankan.\n');
  console.log('📝 Langkah selanjutnya:');
  console.log('   - Test database: npm run test:database');
  console.log('   - Start bot: npm run bot');
  console.log('   - Start desktop app: npm start\n');
  process.exit(0);
} else if (errors.length === 0) {
  console.log('✅ Tidak ada error fatal, tapi ada beberapa warning.\n');
  console.log('📝 Langkah selanjutnya:');
  console.log('   - Perbaiki warning di atas (opsional)');
  console.log('   - Test database: npm run test:database');
  console.log('   - Start bot: npm run bot\n');
  process.exit(0);
} else {
  console.log('❌ Ada error yang harus diperbaiki sebelum menjalankan aplikasi!\n');
  console.log('📚 Dokumentasi:');
  console.log('   - Baca KONFIGURASI.md untuk detail setiap field');
  console.log('   - Baca CARA_SETUP.md untuk panduan setup\n');
  process.exit(1);
}
