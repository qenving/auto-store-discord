let {
    EmbedBuilder,
    Client,
    CommandInteraction,
    ChannelType,
    AttachmentBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ApplicationCommandOptionType,
} = require("discord.js");
let mt = require("../../Schema/mt.js")
module.exports = {
    name: 'setmt',
    description: "set Your Bo To Mt",
    accessableby: "admin",
    /** 
     * @param {Client} client 
     * @param {CommandInteraction} interaction
     * @param {String[]} args 
     */
    run: async (client, interaction, args) => {
        await mt
            .findOne({})
            .then(async (d) => {
                if (d) {
                    d.mt = !d?.mt;
                    await d
                        .save()
                        .then((d1) => {
                            interaction.reply({
                                content:`${d?.mt ? "Bot Maintenance" : "Done Maintenance"}`,
                                ephemeral: true
                            });
                        })
                        .catch(console.error);
                } else {
                    await new mt({ mt: !d?.mt })
                        .save()
                        .then((d) => {
                            interaction.reply({
                                content:`${d?.mt ? "Bot Maintenance" : "Done Maintenance"}`,
                                ephemeral: true
                            });
                        })
                        .catch(console.error);
                }
            })
            .catch(console.error);
    }
}