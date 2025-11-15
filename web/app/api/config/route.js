import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), '../config.json');

// GET - Fetch current configuration
export async function GET() {
  try {
    // Check if config file exists
    if (!fs.existsSync(CONFIG_PATH)) {
      return NextResponse.json(
        { error: 'Configuration file not found' },
        { status: 404 }
      );
    }

    // Read config file
    const configData = fs.readFileSync(CONFIG_PATH, 'utf-8');
    const config = JSON.parse(configData);

    // Remove sensitive data before sending (optional - but we'll send everything for editing)
    // For security, you might want to mask tokens in production
    return NextResponse.json(config);

  } catch (error) {
    console.error('Error reading config:', error);
    return NextResponse.json(
      { error: 'Failed to read configuration' },
      { status: 500 }
    );
  }
}

// POST - Update configuration
export async function POST(request) {
  try {
    const newConfig = await request.json();

    // Validate config structure
    const validationError = validateConfig(newConfig);
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      );
    }

    // Read current config to merge with comment fields
    const currentConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));

    // Preserve all comment fields (fields starting with _)
    const mergedConfig = preserveComments(currentConfig, newConfig);

    // Write updated config
    fs.writeFileSync(
      CONFIG_PATH,
      JSON.stringify(mergedConfig, null, 2),
      'utf-8'
    );

    return NextResponse.json({
      success: true,
      message: 'Configuration updated successfully'
    });

  } catch (error) {
    console.error('Error updating config:', error);
    return NextResponse.json(
      { error: 'Failed to update configuration' },
      { status: 500 }
    );
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function validateConfig(config) {
  // Validate mode
  const validModes = ['DiscordBotOnly', 'WebOnly', 'IntegratedMode'];
  if (!validModes.includes(config.mode)) {
    return `Invalid mode. Must be one of: ${validModes.join(', ')}`;
  }

  // Validate database type
  const validDatabases = ['mysql', 'mongodb'];
  if (!validDatabases.includes(config.database?.type)) {
    return `Invalid database type. Must be one of: ${validDatabases.join(', ')}`;
  }

  // Validate payment provider
  const validPayments = ['midtrans', 'duitku', 'tripay'];
  if (!validPayments.includes(config.payment?.provider)) {
    return `Invalid payment provider. Must be one of: ${validPayments.join(', ')}`;
  }

  // Validate Discord config
  if (!config.discord?.token || config.discord.token.includes('PASTE_')) {
    return 'Discord bot token is required';
  }

  if (!config.discord?.clientId || config.discord.clientId.includes('PASTE_')) {
    return 'Discord client ID is required';
  }

  if (!config.discord?.guildId || config.discord.guildId.includes('PASTE_')) {
    return 'Discord guild ID is required';
  }

  if (!config.discord?.ownerId || config.discord.ownerId.includes('PASTE_')) {
    return 'Discord owner ID is required';
  }

  // Validate limits
  if (config.limits?.maxPendingOrders < 1 || config.limits?.maxPendingOrders > 50) {
    return 'Max pending orders must be between 1 and 50';
  }

  if (config.limits?.minDeposit < 1000) {
    return 'Minimum deposit must be at least 1000';
  }

  if (config.limits?.maxDeposit < config.limits?.minDeposit) {
    return 'Maximum deposit must be greater than minimum deposit';
  }

  return null; // No errors
}

function preserveComments(oldConfig, newConfig) {
  const result = { ...newConfig };

  // Copy all comment fields from old config
  for (const key in oldConfig) {
    if (key.startsWith('_')) {
      result[key] = oldConfig[key];
    }
  }

  // Preserve nested comment fields
  if (oldConfig.database) {
    result.database = {
      ...result.database,
      _keterangan_mysql: oldConfig.database._keterangan_mysql,
      _keterangan_mongodb: oldConfig.database._keterangan_mongodb,
    };
  }

  if (oldConfig.discord) {
    result.discord = {
      ...result.discord,
      _optional_channels: oldConfig.discord._optional_channels,
    };
  }

  if (oldConfig.payment) {
    result.payment = {
      ...result.payment,
      _keterangan_midtrans: oldConfig.payment._keterangan_midtrans,
      _keterangan_duitku: oldConfig.payment._keterangan_duitku,
      _keterangan_tripay: oldConfig.payment._keterangan_tripay,
    };

    // Preserve nested comment fields in payment providers
    if (oldConfig.payment.midtrans) {
      result.payment.midtrans = {
        ...result.payment.midtrans,
        _pilihan_production: oldConfig.payment.midtrans._pilihan_production,
      };
    }
  }

  if (oldConfig.features) {
    result.features = {
      ...result.features,
      _autoDelivery_info: oldConfig.features._autoDelivery_info,
      _autoExpireInvoice_info: oldConfig.features._autoExpireInvoice_info,
      _testimoniIntegration_info: oldConfig.features._testimoniIntegration_info,
      _maintenance_info: oldConfig.features._maintenance_info,
    };
  }

  if (oldConfig.limits) {
    result.limits = {
      ...result.limits,
      _maxPendingOrders_info: oldConfig.limits._maxPendingOrders_info,
      _minDeposit_info: oldConfig.limits._minDeposit_info,
      _maxDeposit_info: oldConfig.limits._maxDeposit_info,
    };
  }

  return result;
}
