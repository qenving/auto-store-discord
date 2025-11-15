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
    name: 'changetype',
    description: "Change Type Of Product",
    accessableby: "admin",
    options: [
        {
            name: "code",
            description: "Code Of Product",
            type: ApplicationCommandOptionType.String,
            required: true
        },
        {
            name: "type",
            description: "New Type For Product",
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
        let typeName = interaction.options.getString("type");
        let userars = await client.users.fetch(Owner);

        let getCode = await list
            .findOne({ code: code })
            .catch(console.error);

        if (!getCode) return interaction.reply({
            content: `Product With That Code Doesn't Exist`,
            ephemeral: true
        });

        if (typeName) {
            if (typeName.includes("script") || typeName.includes("yes")) {
                await list
                    .updateOne(
                        {
                            code: code,
                        },
                        {
                            type: typeName,
                        }
                    )
                    .then((d) => {
                        interaction.reply({ content: `Product Type Changed **${getCode.type}** to **${typeName}**`, ephemeral: true });
                        let sendToOwner = new EmbedBuilder()
                            .setTitle("Change Type History")
                            .setDescription(
                                `
                        New Type: ${typeName}
                        `
                        .replace(/ {2,}/g, "")
                            )
                            .setTimestamp();
                        userars.send({ embeds: [sendToOwner] });
                    })
                    .catch(console.error);
            } else {
                interaction.reply({
                    content: `Only Put **script** Or **yes** For The Type`,
                    ephemeral: true
                });
            }
        }
    }
}