const { EmbedBuilder } = require('discord.js');
const globalEvents = require('../../../shared/utils/EventEmitter');
const Formatter = require('../../../shared/utils/Formatter');
const logger = require('../../../shared/logger/Logger');

/**
 * Listen for deposit success events from payment callback
 * Send DM notification to user
 */
module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    // Listen to global deposit events
    globalEvents.on('deposit', async (data) => {
      try {
        const { discordId, amount, invoiceId, balanceAfter } = data;

        // Get user
        const user = await client.users.fetch(discordId);

        if (!user) {
          logger.warn('User not found for deposit notification', { discordId });
          return;
        }

        // Send DM
        const embed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('✅ Deposit Successful!')
          .setDescription('Your payment has been confirmed and balance has been added.')
          .addFields(
            { name: 'Amount Deposited', value: Formatter.formatCurrency(amount), inline: true },
            { name: 'New Balance', value: Formatter.formatCurrency(balanceAfter), inline: true },
            { name: 'Invoice ID', value: `\`${invoiceId}\``, inline: false }
          )
          .setFooter({ text: 'Thank you for your deposit!' })
          .setTimestamp();

        await user.send({ embeds: [embed] });

        logger.info('Deposit notification sent', { discordId, invoiceId, amount });
      } catch (error) {
        logger.error('Error sending deposit notification', error);
      }
    });

    logger.info('Deposit success listener registered');
  }
};
