const logger = require('../../shared/logger/Logger');

/**
 * Handle button interactions
 */
async function handleButton(interaction, client) {
  const customId = interaction.customId;

  try {
    const handler = client.components.get(customId);

    if (handler && typeof handler.execute === 'function') {
      await handler.execute(interaction, client);
    } else {
      // Try pattern matching for dynamic buttons (e.g., buy_productId)
      const [action, ...params] = customId.split('_');
      const patternHandler = client.components.get(action);

      if (patternHandler && typeof patternHandler.execute === 'function') {
        await patternHandler.execute(interaction, client, params);
      } else {
        logger.warn(`No handler found for button: ${customId}`);
        await interaction.reply({
          content: 'This button is not configured properly.',
          ephemeral: true
        });
      }
    }
  } catch (error) {
    logger.error('Error handling button interaction', error, { customId });

    const errorMessage = {
      content: 'An error occurred while processing this button.',
      ephemeral: true
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
}

/**
 * Handle select menu interactions
 */
async function handleSelectMenu(interaction, client) {
  const customId = interaction.customId;

  try {
    const handler = client.components.get(customId);

    if (handler && typeof handler.execute === 'function') {
      await handler.execute(interaction, client);
    } else {
      logger.warn(`No handler found for select menu: ${customId}`);
      await interaction.reply({
        content: 'This select menu is not configured properly.',
        ephemeral: true
      });
    }
  } catch (error) {
    logger.error('Error handling select menu interaction', error, { customId });

    const errorMessage = {
      content: 'An error occurred while processing this selection.',
      ephemeral: true
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
}

module.exports = {
  handleButton,
  handleSelectMenu
};
