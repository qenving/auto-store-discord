const logger = require('../../../shared/logger/Logger');
const { ActivityType } = require('discord.js');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    logger.info(`Discord bot ready! Logged in as ${client.user.tag}`);
    logger.info(`Serving ${client.guilds.cache.size} guilds`);

    client.isReady = true;

    // Set bot status
    client.user.setPresence({
      activities: [{
        name: 'Auto-Store System',
        type: ActivityType.Watching
      }],
      status: 'online'
    });

    // Log statistics
    const stats = client.getStats();
    logger.info('Bot Statistics', stats);
  }
};
