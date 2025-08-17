const { TOKEN } = require("../config/config.json");
const connectdiscord = async (client) => {
    try {
        await client.login(TOKEN);
    } catch (error) {
        console.log(`[SYSTEM ERROR]`.bgRed.bold, `Already Error In Token!\n${error}`.red)
        process.exit(1);
    }
}

module.exports = connectdiscord