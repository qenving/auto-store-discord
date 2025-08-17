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
let list = require("../../Schema/list.js");
let client = require('../../index.js');
let { Owner } = require('../../config/config.json');
module.exports = {
    name: 'removeproduct',
    description: "Remove Product From Stock List",
    accessableby: "admin",
    options: [
        {
            name: "code",
            description: "Code Of Product",
            type: ApplicationCommandOptionType.String,
            required: true
        }
    ],
    /** 
     * @param {Client} client 
     * @param {CommandInteraction} interaction
     * @param {String[]} args 
     */
    run: async (client, interaction, args) => {
        let code = interaction.options.getString("code");
        let user = await client.users.fetch(Owner);

        let getCode = await list
            .findOne({ code: code })
            .then((res) => {
                return res;
            })
            .catch(console.error);

        if (!getCode) return interaction.reply({
            content: "Product With That Code Doesnt Exist",
            ephemeral: true
        });

        await list
            .deleteOne({ code: code })
            .then(async (d) => {
                await interaction.reply({
                    content: "Product Removed",
                    ephemeral: true
                });
            })
            .catch(console.error);
        let sendToOwner = new EmbedBuilder()
            .setTitle("Removed Product History")
            .setDescription(
                `
         Code: ${code}
       `.replace(/ {2,}/g, "")
            )
            .setTimestamp();
        user.send({ embeds: [sendToOwner] });
    }
}