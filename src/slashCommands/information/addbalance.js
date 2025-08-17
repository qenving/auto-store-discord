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
let Bal = require("../../Schema/balance.js");
let { Owner } = require("../../config/config.json");
let { COLOR } = require("../../config/configEmoji.json");
module.exports = {
    name: 'addbalance',
    description: "add balance to user",
    accessableby: "admin",
    options: [
        {
            name: "user",
            description: "User To Add Balance",
            type: ApplicationCommandOptionType.User,
            required: true
        },
        {
            name: "balance",
            description: "how many balance?",
            type: ApplicationCommandOptionType.Number,
            required: true
        }
    ],
    /** 
     * @param {Client} client 
     * @param {CommandInteraction} interaction
     * @param {String[]} args 
     */
    run: async (client, interaction, args) => {
        let growId1 = interaction.options.getUser("user");
        let growId = growId1.id;
        let user = await client.users.fetch(Owner);
        let Balance = interaction.options.getNumber("balance");

        let wallet1 = await Bal.findOne({ DiscordID: growId })
            .then((d) => {
                return d;
            })
            .catch((e) => console.error(e));

        if (!wallet1) return interaction.reply({
            content: "**The user with the tagged user was not found!**",
            ephemeral: true
        });
        
        if (Balance < 1) return interaction.reply({
            content: `Use a positif number!`,
            ephemeral: true
        });

        await Bal.updateOne({ DiscordID: growId }, { $inc: { Balance: Balance, Deposit: Balance } });
        await interaction.reply({ content: `${Balance} Balance Added To <@${growId}>`, ephemeral: true });

        let sendToOwner = new EmbedBuilder()
            .setTitle("Adding Balance History")
            .setDescription(
                `
             User: <@${wallet1.DiscordID}>
             Amount: ${Balance}
           `.replace(/ {2,}/g, "")
            )
            .setTimestamp()
            .setColor(COLOR);
        user.send({ embeds: [sendToOwner] });
    }
}