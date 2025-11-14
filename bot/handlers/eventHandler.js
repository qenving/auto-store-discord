const fs = require('fs');
const path = require('path');
const logger = require('../../shared/logger/Logger');

/**
 * Load all events from events directory
 */
function loadEvents(client) {
  const eventsPath = path.join(__dirname, '../events');
  const eventFolders = fs.readdirSync(eventsPath);

  let totalEvents = 0;

  for (const folder of eventFolders) {
    const folderPath = path.join(eventsPath, folder);

    if (!fs.statSync(folderPath).isDirectory()) continue;

    const eventFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
      const filePath = path.join(folderPath, file);

      try {
        const event = require(filePath);

        if ('name' in event && 'execute' in event) {
          if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
          } else {
            client.on(event.name, (...args) => event.execute(...args, client));
          }

          totalEvents++;
          logger.debug(`Event loaded: ${event.name}`);
        } else {
          logger.warn(`Event at ${filePath} is missing required "name" or "execute" property`);
        }
      } catch (error) {
        logger.error(`Failed to load event: ${file}`, error);
      }
    }
  }

  logger.info(`Loaded ${totalEvents} events`);
  return totalEvents;
}

module.exports = {
  loadEvents
};
