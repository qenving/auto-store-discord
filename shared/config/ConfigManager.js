const fs = require('fs');
const path = require('path');

/**
 * ConfigManager - Centralized configuration management
 * Supports 3 modes: DiscordBotOnly, WebOnly, IntegratedMode
 */
class ConfigManager {
  constructor() {
    this.config = null;
    this.mode = null;
    this.isLoaded = false;
  }

  /**
   * Load configuration from file and environment
   */
  load() {
    try {
      // Load from config.json
      const configPath = path.join(process.cwd(), 'config.json');

      if (!fs.existsSync(configPath)) {
        throw new Error('config.json not found! Please copy config.example.json to config.json');
      }

      this.config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

      // Override with environment variables if present
      this.config.mode = process.env.MODE || this.config.mode || 'IntegratedMode';

      // Validate mode
      const validModes = ['DiscordBotOnly', 'WebOnly', 'IntegratedMode'];
      if (!validModes.includes(this.config.mode)) {
        throw new Error(`Invalid mode: ${this.config.mode}. Must be one of: ${validModes.join(', ')}`);
      }

      this.mode = this.config.mode;
      this.isLoaded = true;

      console.log(`[ConfigManager] Loaded successfully in ${this.mode} mode`);

      return this.config;
    } catch (error) {
      console.error('[ConfigManager] Failed to load configuration:', error.message);
      throw error;
    }
  }

  /**
   * Get full configuration
   */
  getConfig() {
    if (!this.isLoaded) {
      this.load();
    }
    return this.config;
  }

  /**
   * Get current mode
   */
  getMode() {
    if (!this.isLoaded) {
      this.load();
    }
    return this.mode;
  }

  /**
   * Check if Discord bot should be enabled
   */
  isBotEnabled() {
    return this.mode === 'DiscordBotOnly' || this.mode === 'IntegratedMode';
  }

  /**
   * Check if website should be enabled
   */
  isWebEnabled() {
    return this.mode === 'WebOnly' || this.mode === 'IntegratedMode';
  }

  /**
   * Check if integrated features should be enabled
   */
  isIntegrated() {
    return this.mode === 'IntegratedMode';
  }

  /**
   * Get database configuration
   */
  getDatabaseConfig() {
    return this.getConfig().database;
  }

  /**
   * Get Discord configuration
   */
  getDiscordConfig() {
    if (!this.isBotEnabled()) {
      throw new Error('Discord bot is not enabled in current mode');
    }
    return this.getConfig().discord;
  }

  /**
   * Get website configuration
   */
  getWebsiteConfig() {
    if (!this.isWebEnabled()) {
      throw new Error('Website is not enabled in current mode');
    }
    return this.getConfig().website;
  }

  /**
   * Get payment configuration
   */
  getPaymentConfig() {
    return this.getConfig().payment;
  }

  /**
   * Get OAuth configuration
   */
  getOAuthConfig() {
    if (!this.isWebEnabled()) {
      throw new Error('OAuth is only available in Web modes');
    }
    return this.getConfig().oauth;
  }

  /**
   * Check if maintenance mode is active
   */
  isMaintenanceMode() {
    return this.getConfig().features?.maintenance || false;
  }

  /**
   * Get feature flags
   */
  getFeatures() {
    return this.getConfig().features || {};
  }

  /**
   * Get limits configuration
   */
  getLimits() {
    return this.getConfig().limits || {};
  }

  /**
   * Validate configuration completeness with friendly Indonesian error messages
   */
  validate() {
    const config = this.getConfig();
    const errors = [];
    const warnings = [];

    // Validate database config
    if (!config.database || !config.database.type) {
      errors.push('❌ database.type belum dipilih!\n   Pilihan: "mysql" atau "mongodb"\n   Cara: Edit config.json → database.type');
    } else {
      // Validate MySQL config
      if (config.database.type === 'mysql') {
        const mysql = config.database.mysql;
        if (!mysql) {
          errors.push('❌ database.mysql section tidak ditemukan!\n   Cara: Lihat config.example.json untuk template MySQL');
        } else {
          if (!mysql.host) {
            errors.push('❌ database.mysql.host belum diisi!\n   Default: "localhost" (untuk MySQL lokal)');
          }
          if (!mysql.user) {
            errors.push('❌ database.mysql.user belum diisi!\n   Default: "root" (untuk development)');
          }
          if (!mysql.password || mysql.password.includes('ISI_PASSWORD')) {
            warnings.push('⚠️  database.mysql.password belum diisi atau masih default\n   Ini bisa menyebabkan gagal koneksi ke database');
          }
          if (!mysql.database) {
            errors.push('❌ database.mysql.database belum diisi!\n   Contoh: "autostore"');
          }
        }
      }

      // Validate MongoDB config
      if (config.database.type === 'mongodb') {
        if (!config.database.mongodb?.uri) {
          errors.push('❌ database.mongodb.uri belum diisi!\n   Format: mongodb://localhost:27017/autostore (local)\n   Atau: mongodb+srv://user:pass@cluster.mongodb.net/db (Atlas)');
        }
      }
    }

    // Validate Discord config (if bot enabled)
    if (this.isBotEnabled()) {
      if (!config.discord) {
        errors.push('❌ discord section tidak ditemukan!\n   Cara: Lihat config.example.json untuk template Discord');
      } else {
        if (!config.discord.token || config.discord.token.includes('PASTE_')) {
          errors.push('❌ discord.token belum diisi!\n   Cara: Baca CARA_SETUP.md bagian "Mendapatkan Bot Token"\n   Portal: https://discord.com/developers/applications');
        }
        if (!config.discord.clientId || config.discord.clientId.includes('PASTE_')) {
          errors.push('❌ discord.clientId belum diisi!\n   Cara: Discord Developer Portal → OAuth2 → Client ID\n   Baca CARA_SETUP.md untuk panduan lengkap');
        }
        if (!config.discord.guildId || config.discord.guildId.includes('PASTE_')) {
          errors.push('❌ discord.guildId belum diisi!\n   Cara: Right-click server Discord → Copy ID\n   (Aktifkan Developer Mode di User Settings → Advanced)');
        }
        if (!config.discord.ownerId || config.discord.ownerId.includes('PASTE_')) {
          warnings.push('⚠️  discord.ownerId belum diisi\n   Beberapa admin command tidak akan bisa digunakan\n   Cara: Right-click profile Anda → Copy ID');
        }
      }
    }

    // Validate website config (if web enabled)
    if (this.isWebEnabled()) {
      if (!config.website) {
        warnings.push('⚠️  website section tidak ditemukan\n   Web dashboard mungkin tidak berfungsi dengan baik');
      } else {
        if (!config.website.jwtSecret || config.website.jwtSecret.includes('GANTI_')) {
          warnings.push('⚠️  website.jwtSecret belum diisi atau masih default!\n   Ini TIDAK AMAN untuk production\n   Cara: Ganti dengan random string minimal 32 karakter');
        }
        if (!config.website.adminSecretKey || config.website.adminSecretKey.includes('PASSWORD_')) {
          warnings.push('⚠️  website.adminSecretKey belum diisi atau masih default!\n   Admin login tidak aman!\n   Cara: Ganti dengan password yang kuat');
        }
      }
    }

    // Validate payment config (optional but warn if misconfigured)
    const paymentProvider = config.payment?.provider;
    if (!paymentProvider) {
      warnings.push('⚠️  payment.provider belum dipilih\n   Payment gateway tidak akan berfungsi\n   Pilihan: "midtrans", "duitku", "tripay", "manual"');
    } else if (paymentProvider !== 'manual') {
      const providerConfig = config.payment[paymentProvider];
      if (!providerConfig) {
        warnings.push(`⚠️  payment.${paymentProvider} section tidak ditemukan\n   Payment tidak akan berfungsi`);
      } else {
        // Check API keys based on provider
        if (paymentProvider === 'midtrans') {
          if (!providerConfig.serverKey || providerConfig.serverKey.includes('PASTE_')) {
            warnings.push('⚠️  payment.midtrans.serverKey belum diisi\n   Daftar di https://midtrans.com untuk mendapatkan API key');
          }
        }
        if (paymentProvider === 'duitku') {
          if (!providerConfig.apiKey || providerConfig.apiKey.includes('PASTE_')) {
            warnings.push('⚠️  payment.duitku.apiKey belum diisi\n   Daftar di https://duitku.com untuk mendapatkan API key');
          }
        }
        if (paymentProvider === 'tripay') {
          if (!providerConfig.apiKey || providerConfig.apiKey.includes('PASTE_')) {
            warnings.push('⚠️  payment.tripay.apiKey belum diisi\n   Daftar di https://tripay.co.id untuk mendapatkan API key');
          }
        }
      }
    }

    // Print validation results
    if (errors.length > 0) {
      console.error('\n╔════════════════════════════════════════════════════════╗');
      console.error('║        KONFIGURASI ERROR - HARUS DIPERBAIKI!           ║');
      console.error('╚════════════════════════════════════════════════════════╝\n');

      errors.forEach((err, i) => {
        console.error(`${i + 1}. ${err}\n`);
      });

      console.error('📚 Dokumentasi:');
      console.error('   - Baca KONFIGURASI.md untuk penjelasan setiap field');
      console.error('   - Baca CARA_SETUP.md untuk panduan setup lengkap');
      console.error('   - Jalankan: npm run test:config untuk validasi\n');

      throw new Error('Configuration validation failed. Please fix the errors above.');
    }

    if (warnings.length > 0) {
      console.warn('\n╔════════════════════════════════════════════════════════╗');
      console.warn('║      KONFIGURASI WARNING - SEBAIKNYA DIPERBAIKI        ║');
      console.warn('╚════════════════════════════════════════════════════════╝\n');

      warnings.forEach((warn, i) => {
        console.warn(`${i + 1}. ${warn}\n`);
      });

      console.warn('ℹ️  Warning ini tidak akan menghentikan aplikasi,');
      console.warn('   tapi sebaiknya diperbaiki untuk keamanan dan fungsionalitas penuh.\n');
    }

    if (errors.length === 0 && warnings.length === 0) {
      console.log('\n✅ Konfigurasi valid! Aplikasi siap dijalankan.\n');
    }

    return true;
  }
}

// Singleton instance
const configManager = new ConfigManager();

module.exports = configManager;
