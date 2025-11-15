require('./console/watermark')
let {
    GatewayIntentBits,
    Client,
    Collection,
    Partials,
} = require("discord.js");
let { readdirSync } = require("fs");
let IncludedIntents = Object.entries(GatewayIntentBits).reduce(
    (t, [, V]) => t | V,
    0
);
let client = new Client({ intents: IncludedIntents });

client.startTime = Date.now();
client.events = new Collection()
client.slash = new Collection()
client.config = require("./config/config.json")

module.exports = client;

["event", "slash", "mongodb", "discord"].forEach((file) => {
    require(`./handlers/${file}`)(client);
});

process.on("unhandledRejection", async (err) => {
    console.log(`[ANTI - CRUSH] Unhandled Rejection : ${err.stack}`)
})