const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const configManager = require('../../../shared/config/ConfigManager');
const logger = require('../../../shared/logger/Logger');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('maintenance')
    .setDescription('Toggle maintenance mode (Owner only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option
        .setName('action')
        .setDescription('Action to perform')
        .setRequired(true)
        .addChoices(
          { name: 'Enable', value: 'on' },
          { name: 'Disable', value: 'off' },
          { name: 'Status', value: 'status' }
        )
    ),

  async execute(interaction, client) {
    try {
      // Check if user is owner
      const config = configManager.getConfig();
      if (interaction.user.id !== config.discord.ownerId) {
        return interaction.reply({
          content: '❌ This command can only be used by the bot owner.',
          ephemeral: true
        });
      }

      const action = interaction.options.getString('action');
      const configPath = path.join(process.cwd(), 'config.json');

      if (action === 'status') {
        const isMaintenance = config.features.maintenance;
        const embed = new EmbedBuilder()
          .setColor(isMaintenance ? '#FF0000' : '#00FF00')
          .setTitle('🔧 Maintenance Mode Status')
          .setDescription(isMaintenance ? '**Maintenance mode is ENABLED**\n\nMost commands are disabled.' : '**Maintenance mode is DISABLED**\n\nAll commands are operational.')
          .setTimestamp();

        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      await interaction.deferReply();

      const enableMaintenance = action === 'on';

      // Read config file
      let configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));

      // Update maintenance mode
      configData.features.maintenance = enableMaintenance;

      // Write back to file
      fs.writeFileSync(configPath, JSON.stringify(configData, null, 2), 'utf8');

      // Update in memory
      config.features.maintenance = enableMaintenance;

      const embed = new EmbedBuilder()
        .setColor(enableMaintenance ? '#FF0000' : '#00FF00')
        .setTitle('🔧 Maintenance Mode Updated')
        .setDescription(enableMaintenance ? '**Maintenance mode has been ENABLED**\n\nMost user commands are now disabled.' : '**Maintenance mode has been DISABLED**\n\nAll commands are now operational.')
        .setFooter({ text: `Changed by ${interaction.user.tag}` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

      logger.admin('Maintenance mode toggled', interaction.user.id, {
        enabled: enableMaintenance
      });
    } catch (error) {
      logger.error('Error toggling maintenance mode', error);
      await interaction.editReply({ content: '❌ Failed to toggle maintenance mode.' });
    }
  }
};
