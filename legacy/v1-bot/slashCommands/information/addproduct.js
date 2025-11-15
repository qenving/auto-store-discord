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
module.exports = {
    name: 'addproduct',
    description: "Add Product In Database",
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
            description: "Name Of Product",
            type: ApplicationCommandOptionType.String,
            required: true
        },
        {
            name: "minimum",
            description: "Minimum Buying Of Product!",
            type: ApplicationCommandOptionType.Number,
            required: true
        },
        {
            name: "role",
            description: "Tag Role For Change Role",
            type: ApplicationCommandOptionType.Role,
            required: true
        },
        {
            name: "type",
            description: "Choose option above this!",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                {
                    name: "For Sell CID/RDP/SHOCK5/VPN/ETC 💻",
                    value: "yes"
                },
                {
                    name: "For Sell Script Only 📜",
                    value: "script"
                }
            ]
        },
    ],
    /** 
     * @param {Client} client 
     * @param {CommandInteraction} interaction
     * @param {String[]} args 
     */
    run: async (client, interaction, args) => {
        let code = interaction.options.getString("code");
        let productName = interaction.options.getString("name");
        let typeName = interaction.options.getString("type");
        let minimum = interaction.options.getNumber("minimum");
        let Role = interaction.options.getRole("role");

        let getCode = await list
            .findOne({ code: code })
            .then((res) => {
                return res;
            })
            .catch(console.error);
        console.log(getCode);

        if (getCode) return interaction.reply({
            content: `Code Has Been Used`,
            ephemeral: true
        });

        await new list({
            code: code,
            name: productName,
            minimum: minimum,
            type: typeName,
            role: Role.id,
        })
            .save()
            .then(async (d) => {
                await interaction.reply({
                    content: `Product Was Added`,
                    ephemeral: true
                });
            })
            .catch((e) => console.error(e));
    }
}