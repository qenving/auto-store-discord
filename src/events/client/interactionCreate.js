let { PermissionsBitField, EmbedBuilder } = require('discord.js');
let client = require('../../index');
let { Owner, Admin } = require("../../config/config.json");
let cooldown = new Map();

module.exports = {
    name: "interactionCreate"
};

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (!interaction.type == 2) return;

    let command = client.slash.get(interaction.commandName);

    if (!command) return;

    try {
        console.log(`[SYSTEM]`.bgRed.bold, `${interaction.user.username}`.bgYellow.bold, `Using Commands /${command.name}`.bgCyan.bold);
        let lcd = cooldown.get(interaction.user.id);
        if (lcd && Date.now() < lcd) {
            let rt = Math.ceil((lcd - Date.now()) / 1000);
            return interaction.reply({
                embeds: [{
                    description: `Commands can be used again in **${rt} Seconds**`
                }],
                ephemeral: true
            });
        }

        cooldown.set(interaction.user.id, Date.now() + 5000)

        if (!interaction.guild) return interaction.reply({
            embeds: [
                {
                    description: `Only can use in the server`
                }
            ],
            ephemeral: true
        });

        if (command.accessableby === "admin") {
            if (!Admin.includes(interaction.user.id) && interaction.user.id !== Owner) return interaction.reply({
                embeds: [{
                    description: `You do not allowed to use this commands!`
                }],
                ephemeral: true
            });

            await command.run(client, interaction, interaction.options)
        } else {
            await command.run(client, interaction, interaction.options)
        }
    } catch (err) {
        console.log(err.stack);
    }
})