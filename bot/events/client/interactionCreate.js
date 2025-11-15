const logger = require('../../../shared/logger/Logger');
const configManager = require('../../../shared/config/ConfigManager');
const { handleButton, handleSelectMenu } = require('../../handlers/componentHandler');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);

      if (!command) {
        logger.warn(`No command matching ${interaction.commandName} was found.`);
        return;
      }

      try {
        // Check maintenance mode
        const config = configManager.getConfig();
        const isMaintenance = config.features?.maintenance || false;
        const isOwner = interaction.user.id === config.discord.ownerId;
        const allowedCommands = ['help', 'status', 'maintenance'];

        if (isMaintenance && !isOwner && !allowedCommands.includes(command.data.name)) {
          return interaction.reply({
            content: '🔧 **Maintenance Mode**\n\nThe bot is currently under maintenance. Please try again later.',
            ephemeral: true
          });
        }

        // Check cooldown
        const { cooldowns } = client;

        if (!cooldowns.has(command.data.name)) {
          cooldowns.set(command.data.name, new Map());
        }

        const now = Date.now();
        const timestamps = cooldowns.get(command.data.name);
        const cooldownAmount = (command.cooldown || 3) * 1000;

        if (timestamps.has(interaction.user.id)) {
          const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

          if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            return interaction.reply({
              content: `Please wait ${timeLeft.toFixed(1)} more seconds before reusing the \`${command.data.name}\` command.`,
              ephemeral: true
            });
          }
        }

        timestamps.set(interaction.user.id, now);
        setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

        // Execute command
        await command.execute(interaction, client);

        logger.info(`Command executed: ${command.data.name}`, {
          user: interaction.user.tag,
          userId: interaction.user.id,
          guild: interaction.guild?.name
        });
      } catch (error) {
        logger.error(`Error executing command: ${command.data.name}`, error);

        const errorMessage = {
          content: 'There was an error while executing this command!',
          ephemeral: true
        };

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(errorMessage);
        } else {
          await interaction.reply(errorMessage);
        }
      }
    }
    // Handle button interactions
    else if (interaction.isButton()) {
      await handleButton(interaction, client);
    }
    // Handle select menu interactions
    else if (interaction.isStringSelectMenu()) {
      await handleSelectMenu(interaction, client);
    }
  }
};
