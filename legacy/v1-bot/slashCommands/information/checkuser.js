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
    Colors,
} = require("discord.js");
let Bal = require("../../Schema/balance.js");
let { WL, ARROW, Dolar, imageUrl, Crown, COLOR, Bot, Wallet } = require("../../config/configEmoji.json");
module.exports = {
    name: 'checkuser',
    description: "Check Balance And Growid User",
    accessableby: "admin",
    options: [
        {
            name: "user",
            description: "User To Check",
            type: ApplicationCommandOptionType.User,
            required: true
        }
    ],
    /** 
     * @param {Client} client 
     * @param {CommandInteraction} interaction
     * @param {String[]} args 
     */
    run: async (client, interaction, args) => {
        let discorduser = interaction.options.getUser("user");
        let userid = discorduser.id;

        let wallet1 = await Bal.findOne({ DiscordID: userid })
            .then((d) => {
                return d;
            })
            .catch((e) => console.error(e));

        if (!wallet1) return interaction.reply({
            content: "**The user do not set growid right now!**",
            ephemeral: true
        });

        let embed = new EmbedBuilder()
            .setTitle(`${Crown} ${discorduser.username}'s Balance ${Crown}`)
            .setDescription(`${ARROW} GrowID: **${wallet1.GrowIDNow}**\n${ARROW} Balance: **${wallet1.Balance}** ${WL}\n${ARROW} Cash: Rp **${wallet1.Rupiah}**`)
            .setImage(imageUrl)
            .setColor(COLOR);
        
        await interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }
}