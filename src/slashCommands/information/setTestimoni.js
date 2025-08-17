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
let setchannel = require("../../Schema/AllSettingChannel.js");
let  { Owner } = require("../../config/config.json");
module.exports = {
    name: 'setchannel',
    description: "Set Channel Testimoni",
    accessableby: "admin",
    options: [
        {
            name: "testimoni",
            description: "Set Channel For Testimoni",
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
        let data1 = interaction.options.getChannel("testimoni");

        let ChanelID = interaction.guild.channels.cache.get(`${data1.id}`);

        if (!ChanelID.viewable) {
            return interaction.reply({
                content: "The provided channel is not visible to me",
                ephemeral: true
            })
        }

        await setchannel.findOneAndUpdate(
            {},
            { $set: { ChanelTesti: ChanelID } },
            { upsert: true, new: true }
        )
            .then(async (res) => {
                console.log(res);
                await interaction.reply({ content:`Succes Set Chanel Testimoni To **${data1}**`, ephemeral: true });
            })
            .catch((e) => console.error(e));
    }
}