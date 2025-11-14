const fs = require('fs');
const path = require('path');
const logger = require('../../shared/logger/Logger');

/**
 * Load all commands from commands directory
 */
function loadCommands(client) {
  const commandsPath = path.join(__dirname, '../commands');
  const commandFolders = fs.readdirSync(commandsPath);

  let totalCommands = 0;

  for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);

    if (!fs.statSync(folderPath).isDirectory()) continue;

    const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
      const filePath = path.join(folderPath, file);

      try {
        const command = require(filePath);

        if ('data' in command && 'execute' in command) {
          client.setCommand(command.data.name, command);
          totalCommands++;
        } else {
          logger.warn(`Command at ${filePath} is missing required "data" or "execute" property`);
        }
      } catch (error) {
        logger.error(`Failed to load command: ${file}`, error);
      }
    }
  }

  logger.info(`Loaded ${totalCommands} commands`);
  return totalCommands;
}

/**
 * Register slash commands to Discord
 */
async function registerCommands(client, guildId = null) {
  try {
    const commands = [];

    for (const [name, command] of client.commands) {
      commands.push(command.data.toJSON());
    }

    if (guildId) {
      // Guild-specific registration (for testing)
      const guild = await client.guilds.fetch(guildId);
      await guild.commands.set(commands);
      logger.info(`Registered ${commands.length} guild commands for ${guild.name}`);
    } else {
      // Global registration
      await client.application.commands.set(commands);
      logger.info(`Registered ${commands.length} global commands`);
    }

    return true;
  } catch (error) {
    logger.error('Failed to register commands', error);
    throw error;
  }
}

module.exports = {
  loadCommands,
  registerCommands
};
