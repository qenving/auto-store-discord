const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const configManager = require('../../../shared/config/ConfigManager');
const logger = require('../../../shared/logger/Logger');
const fs = require('fs');
const path = require('path');

module.exports = {
  category: 'admin',
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('🔧 Manage bot configuration (Owner only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('📋 View current configuration'))
    .addSubcommandGroup(group =>
      group
        .setName('set')
        .setDescription('⚙️ Set main configuration')
        .addSubcommand(subcommand =>
          subcommand
            .setName('mode')
            .setDescription('Change operation mode')
            .addStringOption(option =>
              option
                .setName('mode')
                .setDescription('Select operation mode')
                .setRequired(true)
                .addChoices(
                  { name: '🤖 Discord Bot Only', value: 'DiscordBotOnly' },
                  { name: '🌐 Web Only', value: 'WebOnly' },
                  { name: '🔗 Integrated Mode', value: 'IntegratedMode' }
                )))
        .addSubcommand(subcommand =>
          subcommand
            .setName('database')
            .setDescription('Change database type')
            .addStringOption(option =>
              option
                .setName('type')
                .setDescription('Select database type')
                .setRequired(true)
                .addChoices(
                  { name: 'MySQL', value: 'mysql' },
                  { name: 'MongoDB', value: 'mongodb' }
                )))
        .addSubcommand(subcommand =>
          subcommand
            .setName('payment')
            .setDescription('Change payment provider')
            .addStringOption(option =>
              option
                .setName('provider')
                .setDescription('Select payment provider')
                .setRequired(true)
                .addChoices(
                  { name: 'Midtrans', value: 'midtrans' },
                  { name: 'Duitku', value: 'duitku' },
                  { name: 'Tripay', value: 'tripay' }
                ))))
    .addSubcommandGroup(group =>
      group
        .setName('discord')
        .setDescription('🔐 Discord bot credentials (Owner only)')
        .addSubcommand(subcommand =>
          subcommand
            .setName('token')
            .setDescription('Set bot token')
            .addStringOption(option =>
              option
                .setName('token')
                .setDescription('Your Discord bot token')
                .setRequired(true)))
        .addSubcommand(subcommand =>
          subcommand
            .setName('client-id')
            .setDescription('Set application/client ID')
            .addStringOption(option =>
              option
                .setName('id')
                .setDescription('Your Discord application ID')
                .setRequired(true)))
        .addSubcommand(subcommand =>
          subcommand
            .setName('guild-id')
            .setDescription('Set server/guild ID')
            .addStringOption(option =>
              option
                .setName('id')
                .setDescription('Your Discord server ID')
                .setRequired(true)))
        .addSubcommand(subcommand =>
          subcommand
            .setName('owner-id')
            .setDescription('Set bot owner ID')
            .addStringOption(option =>
              option
                .setName('id')
                .setDescription('Discord user ID of the owner')
                .setRequired(true))))
    .addSubcommandGroup(group =>
      group
        .setName('channel')
        .setDescription('📢 Set notification channels')
        .addSubcommand(subcommand =>
          subcommand
            .setName('testimoni')
            .setDescription('Set testimoni channel')
            .addChannelOption(option =>
              option
                .setName('channel')
                .setDescription('Channel for testimonials')
                .setRequired(false)))
        .addSubcommand(subcommand =>
          subcommand
            .setName('order-log')
            .setDescription('Set order log channel')
            .addChannelOption(option =>
              option
                .setName('channel')
                .setDescription('Channel for order logs')
                .setRequired(false)))
        .addSubcommand(subcommand =>
          subcommand
            .setName('payment-log')
            .setDescription('Set payment log channel')
            .addChannelOption(option =>
              option
                .setName('channel')
                .setDescription('Channel for payment logs')
                .setRequired(false)))
        .addSubcommand(subcommand =>
          subcommand
            .setName('admin-log')
            .setDescription('Set admin log channel')
            .addChannelOption(option =>
              option
                .setName('channel')
                .setDescription('Channel for admin logs')
                .setRequired(false))))
    .addSubcommandGroup(group =>
      group
        .setName('feature')
        .setDescription('✨ Toggle features on/off')
        .addSubcommand(subcommand =>
          subcommand
            .setName('auto-delivery')
            .setDescription('Toggle auto delivery')
            .addBooleanOption(option =>
              option
                .setName('enabled')
                .setDescription('Enable or disable')
                .setRequired(true)))
        .addSubcommand(subcommand =>
          subcommand
            .setName('auto-expire')
            .setDescription('Toggle auto expire invoice')
            .addBooleanOption(option =>
              option
                .setName('enabled')
                .setDescription('Enable or disable')
                .setRequired(true)))
        .addSubcommand(subcommand =>
          subcommand
            .setName('maintenance')
            .setDescription('Toggle maintenance mode')
            .addBooleanOption(option =>
              option
                .setName('enabled')
                .setDescription('Enable or disable')
                .setRequired(true))))
    .addSubcommandGroup(group =>
      group
        .setName('limits')
        .setDescription('📊 Set transaction limits')
        .addSubcommand(subcommand =>
          subcommand
            .setName('max-pending')
            .setDescription('Set max pending orders per user')
            .addIntegerOption(option =>
              option
                .setName('amount')
                .setDescription('Maximum pending orders (1-50)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(50)))
        .addSubcommand(subcommand =>
          subcommand
            .setName('min-deposit')
            .setDescription('Set minimum deposit amount')
            .addIntegerOption(option =>
              option
                .setName('amount')
                .setDescription('Minimum deposit in IDR')
                .setRequired(true)
                .setMinValue(1000)))
        .addSubcommand(subcommand =>
          subcommand
            .setName('max-deposit')
            .setDescription('Set maximum deposit amount')
            .addIntegerOption(option =>
              option
                .setName('amount')
                .setDescription('Maximum deposit in IDR')
                .setRequired(true)
                .setMinValue(10000))))
    .addSubcommandGroup(group =>
      group
        .setName('bot')
        .setDescription('🤖 Bot control')
        .addSubcommand(subcommand =>
          subcommand
            .setName('restart')
            .setDescription('Restart the bot'))
        .addSubcommand(subcommand =>
          subcommand
            .setName('shutdown')
            .setDescription('Shutdown the bot'))),

  async execute(interaction) {
    const config = configManager.getConfig();

    // Owner-only check
    if (interaction.user.id !== config.discord.ownerId) {
      return interaction.reply({
        content: '❌ This command can only be used by the bot owner.',
        ephemeral: true
      });
    }

    const subcommandGroup = interaction.options.getSubcommandGroup(false);
    const subcommand = interaction.options.getSubcommand();

    try {
      // VIEW CONFIGURATION
      if (subcommand === 'view') {
        return await handleViewConfig(interaction, config);
      }

      // SET MAIN CONFIG
      if (subcommandGroup === 'set') {
        return await handleSetConfig(interaction, subcommand);
      }

      // DISCORD CREDENTIALS
      if (subcommandGroup === 'discord') {
        return await handleDiscordConfig(interaction, subcommand);
      }

      // CHANNEL SETTINGS
      if (subcommandGroup === 'channel') {
        return await handleChannelConfig(interaction, subcommand);
      }

      // FEATURE TOGGLES
      if (subcommandGroup === 'feature') {
        return await handleFeatureConfig(interaction, subcommand);
      }

      // LIMITS
      if (subcommandGroup === 'limits') {
        return await handleLimitsConfig(interaction, subcommand);
      }

      // BOT CONTROL
      if (subcommandGroup === 'bot') {
        return await handleBotControl(interaction, subcommand);
      }

    } catch (error) {
      logger.error('Error in config command:', error);
      return interaction.reply({
        content: `❌ Error: ${error.message}`,
        ephemeral: true
      });
    }
  },
};

// ============================================
// HANDLER FUNCTIONS
// ============================================

async function handleViewConfig(interaction, config) {
  const embed = new EmbedBuilder()
    .setColor('#5865F2')
    .setTitle('⚙️ Current Configuration')
    .setDescription('Here is your current bot configuration')
    .addFields(
      {
        name: '📍 Mode',
        value: `\`${config.mode}\``,
        inline: true
      },
      {
        name: '🗄️ Database',
        value: `\`${config.database.type}\``,
        inline: true
      },
      {
        name: '💳 Payment',
        value: `\`${config.payment.provider}\``,
        inline: true
      },
      {
        name: '🤖 Discord',
        value: [
          `Client ID: \`${config.discord.clientId}\``,
          `Guild ID: \`${config.discord.guildId}\``,
          `Owner ID: \`${config.discord.ownerId}\``,
          `Token: \`${maskToken(config.discord.token)}\``
        ].join('\n'),
        inline: false
      },
      {
        name: '📢 Channels',
        value: [
          `Testimoni: ${config.discord.channels.testimoni || '`Not set`'}`,
          `Order Log: ${config.discord.channels.orderLog || '`Not set`'}`,
          `Payment Log: ${config.discord.channels.paymentLog || '`Not set`'}`,
          `Admin Log: ${config.discord.channels.adminLog || '`Not set`'}`
        ].join('\n'),
        inline: false
      },
      {
        name: '✨ Features',
        value: [
          `Auto Delivery: ${config.features.autoDelivery ? '✅' : '❌'}`,
          `Auto Expire: ${config.features.autoExpireInvoice ? '✅' : '❌'}`,
          `Maintenance: ${config.features.maintenance ? '🔧 ON' : '✅ OFF'}`
        ].join('\n'),
        inline: true
      },
      {
        name: '📊 Limits',
        value: [
          `Max Pending: \`${config.limits.maxPendingOrders}\``,
          `Min Deposit: \`Rp ${config.limits.minDeposit.toLocaleString()}\``,
          `Max Deposit: \`Rp ${config.limits.maxDeposit.toLocaleString()}\``
        ].join('\n'),
        inline: true
      }
    )
    .setFooter({ text: 'Use /config to change settings' })
    .setTimestamp();

  return interaction.reply({
    embeds: [embed],
    ephemeral: true
  });
}

async function handleSetConfig(interaction, subcommand) {
  const configPath = path.join(__dirname, '../../../config.json');
  const configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

  if (subcommand === 'mode') {
    const mode = interaction.options.getString('mode');
    configData.mode = mode;

    fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
    configManager.reload();

    return interaction.reply({
      content: `✅ Mode changed to: **${mode}**\n\n⚠️ **Please restart the bot** for changes to take effect.`,
      ephemeral: true
    });
  }

  if (subcommand === 'database') {
    const dbType = interaction.options.getString('type');
    configData.database.type = dbType;

    fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
    configManager.reload();

    return interaction.reply({
      content: `✅ Database changed to: **${dbType}**\n\n⚠️ **Please restart the bot** and ensure ${dbType} credentials are configured.`,
      ephemeral: true
    });
  }

  if (subcommand === 'payment') {
    const provider = interaction.options.getString('provider');
    configData.payment.provider = provider;

    fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
    configManager.reload();

    return interaction.reply({
      content: `✅ Payment provider changed to: **${provider}**\n\n⚠️ Ensure ${provider} API keys are configured in config.json`,
      ephemeral: true
    });
  }
}

async function handleDiscordConfig(interaction, subcommand) {
  const configPath = path.join(__dirname, '../../../config.json');
  const configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

  if (subcommand === 'token') {
    const token = interaction.options.getString('token');
    configData.discord.token = token;

    fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));

    // Delete the interaction immediately for security
    await interaction.reply({
      content: '✅ Bot token updated successfully.\n\n⚠️ **PLEASE RESTART THE BOT** for changes to take effect.\n\n🔒 This message will be deleted in 5 seconds for security.',
      ephemeral: true
    });

    setTimeout(() => {
      interaction.deleteReply().catch(() => {});
    }, 5000);

    return;
  }

  if (subcommand === 'client-id') {
    const clientId = interaction.options.getString('id');
    configData.discord.clientId = clientId;

    fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
    configManager.reload();

    return interaction.reply({
      content: `✅ Client ID updated to: \`${clientId}\``,
      ephemeral: true
    });
  }

  if (subcommand === 'guild-id') {
    const guildId = interaction.options.getString('id');
    configData.discord.guildId = guildId;

    fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
    configManager.reload();

    return interaction.reply({
      content: `✅ Guild ID updated to: \`${guildId}\`\n\n⚠️ Run \`npm run deploy\` to re-register slash commands.`,
      ephemeral: true
    });
  }

  if (subcommand === 'owner-id') {
    const ownerId = interaction.options.getString('id');
    configData.discord.ownerId = ownerId;

    fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
    configManager.reload();

    return interaction.reply({
      content: `✅ Owner ID updated to: \`${ownerId}\``,
      ephemeral: true
    });
  }
}

async function handleChannelConfig(interaction, subcommand) {
  const configPath = path.join(__dirname, '../../../config.json');
  const configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

  const channel = interaction.options.getChannel('channel');
  const channelId = channel ? channel.id : '';

  const channelMap = {
    'testimoni': 'testimoni',
    'order-log': 'orderLog',
    'payment-log': 'paymentLog',
    'admin-log': 'adminLog'
  };

  const configKey = channelMap[subcommand];
  configData.discord.channels[configKey] = channelId;

  fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
  configManager.reload();

  const channelMention = channel ? `<#${channelId}>` : '`Removed`';
  return interaction.reply({
    content: `✅ ${subcommand} channel set to: ${channelMention}`,
    ephemeral: true
  });
}

async function handleFeatureConfig(interaction, subcommand) {
  const configPath = path.join(__dirname, '../../../config.json');
  const configData = JSON.parse(fs.readFileSync(configPath, null, 2));

  const enabled = interaction.options.getBoolean('enabled');

  const featureMap = {
    'auto-delivery': 'autoDelivery',
    'auto-expire': 'autoExpireInvoice',
    'maintenance': 'maintenance'
  };

  const configKey = featureMap[subcommand];
  configData.features[configKey] = enabled;

  fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
  configManager.reload();

  return interaction.reply({
    content: `✅ **${subcommand}** ${enabled ? 'enabled ✅' : 'disabled ❌'}`,
    ephemeral: true
  });
}

async function handleLimitsConfig(interaction, subcommand) {
  const configPath = path.join(__dirname, '../../../config.json');
  const configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

  const amount = interaction.options.getInteger('amount');

  if (subcommand === 'max-pending') {
    configData.limits.maxPendingOrders = amount;
    fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
    configManager.reload();

    return interaction.reply({
      content: `✅ Max pending orders set to: **${amount}**`,
      ephemeral: true
    });
  }

  if (subcommand === 'min-deposit') {
    configData.limits.minDeposit = amount;
    fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
    configManager.reload();

    return interaction.reply({
      content: `✅ Minimum deposit set to: **Rp ${amount.toLocaleString()}**`,
      ephemeral: true
    });
  }

  if (subcommand === 'max-deposit') {
    configData.limits.maxDeposit = amount;
    fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
    configManager.reload();

    return interaction.reply({
      content: `✅ Maximum deposit set to: **Rp ${amount.toLocaleString()}**`,
      ephemeral: true
    });
  }
}

async function handleBotControl(interaction, subcommand) {
  if (subcommand === 'restart') {
    await interaction.reply({
      content: '🔄 **Restarting bot...**\n\nThe bot will be back online shortly.',
      ephemeral: true
    });

    logger.info(`Bot restart requested by ${interaction.user.tag}`);

    setTimeout(() => {
      process.exit(0); // PM2 or systemd will auto-restart
    }, 2000);

    return;
  }

  if (subcommand === 'shutdown') {
    await interaction.reply({
      content: '⚠️ **Shutting down bot...**\n\nGoodbye!',
      ephemeral: true
    });

    logger.info(`Bot shutdown requested by ${interaction.user.tag}`);

    setTimeout(() => {
      process.exit(1); // Force stop (won't auto-restart)
    }, 2000);

    return;
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function maskToken(token) {
  if (!token || token.includes('PASTE_')) return '`Not configured`';
  return `${token.substring(0, 24)}...${token.substring(token.length - 6)}`;
}
