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
let realtime = require("../../Schema/channelrealtime.js");
module.exports = {
    name: 'setrt',
    description: "sending realtime product",
    accessableby: "admin",
    options: [
        {
            name: "channel",
            description: "Where Channel Do You Want To Send Realtime?",
            type: ApplicationCommandOptionType.Channel,
            required: true
        }
    ],
    /** 
     * @param {Client} client 
     * @param {CommandInteraction} interaction
     * @param {String[]} args 
     */
    run: async (client, interaction, args) => {
        let data1 = interaction.options.getChannel("channel");

        let guya = await data1.send({
            content: `**Successfully Set Your Realtime To ${data1}**`
        });

        await realtime.findOneAndUpdate(
            {},
            { $set: { Channel: data1.id, MessageID: guya.id } },
            { upsert: true, new: true }
        )
            .then(async (res) => {
                console.log(res);
                await interaction.reply({
                    content: `Successfully Set Your Realtime To ${data1}, MessageID: ${guya.id}`,
                    ephemeral: true
                });
            })
            .catch(console.error);
    }
}