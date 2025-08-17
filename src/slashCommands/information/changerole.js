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
    name: 'changerole',
    description: "Change Role Of Product",
    accessableby: "admin",
    options: [
        {
            name: "code",
            description: "Code Of Product",
            type: ApplicationCommandOptionType.String,
            required: true
        },
        {
            name: "role",
            description: "Tag Role For Change Role",
            type: ApplicationCommandOptionType.Role,
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
        let productRoles = interaction.options.getRole("role");
        let productRole = productRoles.id;
        let userars = await client.users.fetch(Owner);

        let getCode = await list
            .findOne({ code: code })
            .catch(console.error);

        if (!getCode) return interaction.reply({
            content: `Product With That Code Doesnt Exit`,
            ephemeral: true
        });

        await list
            .findOneAndUpdate(
                {
                    code: code,
                },
                {
                    role: productRole,
                }
            )
            .then(async (d) => {
                await interaction.reply({
                    content: `Role Changed To **${productRoles}**`,
                    ephemeral: true
                });

                let sendToOwner = new EmbedBuilder()
                    .setTitle("Change Product Role History")
                    .setDescription(
                        `
                    New Role: ${productRole}
                `.replace(/ {2,}/g, "")
                    )
                    .setTimestamp();
                userars.send({ embeds: [sendToOwner] });
            })
            .catch(console.error);
    }
}