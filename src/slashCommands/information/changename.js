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
let { Owner } = require("../../config/config.json");
module.exports = {
    name: 'changename',
    description: "Change Name Of Product",
    accessableby: "admin",
    options: [
        {
            name: "code",
            description: "Code Of Product",
            type: ApplicationCommandOptionType.String,
            required: true
        },
        {
            name: "name",
            description: "New Name For Product",
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
        let productName = interaction.options.getString("name");
        let userars = await client.users.fetch(Owner);

        let getCode = await list
            .findOne({ code: code })
            .catch(console.error);

        if (!getCode) return interaction.reply({
            content: `Product With That Code Doesn't Exist`,
            ephemeral: true
        });


        await list
            .updateOne(
                {
                    code: code,
                },
                {
                    name: productName,
                }
            )
            .then((d) => {
                interaction.reply({ content: "Product Name Changed", ephemeral: true });
                let sendToOwner = new EmbedBuilder()
                    .setTitle("Change Name History")
                    .setDescription(
                        `
                        New Name: ${productName}
                        `
                            .replace(/ {2,}/g, "")
                    )
                    .setTimestamp();
                userars.send({ embeds: [sendToOwner] });
            })
            .catch(console.error);
    }
}