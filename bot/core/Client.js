const { Client, GatewayIntentBits, Collection, Partials } = require('discord.js');
const logger = require('../../shared/logger/Logger');

/**
 * ExtendedClient - Custom Discord.js client with additional features
 */
class ExtendedClient extends Client {
  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages
      ],
      partials: [
        Partials.Channel,
        Partials.Message
      ]
    });

    // Collections
    this.commands = new Collection();
    this.cooldowns = new Collection();
    this.components = new Collection();

    // Bot info
    this.isReady = false;
    this.startTime = Date.now();
  }

  /**
   * Get uptime in seconds
   */
  getUptime() {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  /**
   * Get uptime formatted
   */
  getUptimeFormatted() {
    const seconds = this.getUptime();
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0) parts.push(`${secs}s`);

    return parts.join(' ') || '0s';
  }

  /**
   * Set command
   */
  setCommand(name, command) {
    this.commands.set(name, command);
    logger.debug(`Command loaded: ${name}`);
  }

  /**
   * Set component handler
   */
  setComponent(customId, handler) {
    this.components.set(customId, handler);
    logger.debug(`Component loaded: ${customId}`);
  }

  /**
   * Get bot statistics
   */
  getStats() {
    return {
      guilds: this.guilds.cache.size,
      users: this.users.cache.size,
      channels: this.channels.cache.size,
      commands: this.commands.size,
      uptime: this.getUptimeFormatted(),
      ping: this.ws.ping
    };
  }
}

module.exports = ExtendedClient;
